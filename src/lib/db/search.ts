import { getSqlite } from "./connection";
import { v4 as uuid } from "uuid";

let searchInitialized = false;
const FTS_TABLES = ["stacks_fts", "tools_fts", "comparisons_fts"] as const;

export function initializeSearch(): void {
  if (searchInitialized) return;
  const sqlite = getSqlite();

  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS stacks_fts USING fts5(
      name, description, goal, category,
      content='stacks',
      content_rowid='rowid',
      tokenize='porter unicode61'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS tools_fts USING fts5(
      tool_id, purpose,
      tokenize='porter unicode61'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS comparisons_fts USING fts5(
      comparison_name, tool_ids,
      content='tool_comparisons',
      content_rowid='rowid',
      tokenize='porter unicode61'
    );
  `);

  searchInitialized = true;
}

export function rebuildSearchIndexes(): void {
  const sqlite = getSqlite();
  initializeSearch();
  for (const table of FTS_TABLES) {
    sqlite.exec(`INSERT INTO ${table}(${table}) VALUES('rebuild')`);
  }
}

export interface SearchResult {
  rank: number;
  name: string;
  description: string;
  category?: string;
  matchType: "stack" | "tool";
  stackId?: string;
  toolId?: string;
}

export function searchAll(query: string, limit = 20): SearchResult[] {
  initializeSearch();
  const sqlite = getSqlite();
  const sanitized = query.replace(/['"]/g, "").trim();
  if (!sanitized) return [];

  const results: SearchResult[] = [];

  const stacks = sqlite
    .prepare(
      `SELECT s.id, s.name, s.description, s.category, rank
       FROM stacks_fts f
       JOIN stacks s ON s.rowid = f.rowid
       WHERE stacks_fts MATCH ?
       ORDER BY rank
       LIMIT ?`,
    )
    .all(sanitized, limit) as { id: string; name: string; description: string; category: string; rank: number }[];

  for (const s of stacks) {
    results.push({
      rank: s.rank,
      name: s.name,
      description: s.description,
      category: s.category,
      matchType: "stack",
      stackId: s.id,
    });
  }

  const tools = sqlite
    .prepare(
      `SELECT st.stack_id, st.tool_id, st.purpose, s.name as stack_name, s.description
       FROM tools_fts f
       JOIN stack_tools st ON st.id = f.rowid
       JOIN stacks s ON s.id = st.stack_id
       WHERE tools_fts MATCH ?
       ORDER BY rank
       LIMIT ?`,
    )
    .all(sanitized, limit) as { stack_id: string; tool_id: string; purpose: string; stack_name: string; description: string; rank: number }[];

  for (const t of tools) {
    results.push({
      rank: t.rank,
      name: `${t.tool_id} in ${t.stack_name}`,
      description: t.purpose,
      matchType: "tool",
      stackId: t.stack_id,
      toolId: t.tool_id,
    });
  }

  results.sort((a, b) => a.rank - b.rank);
  return results.slice(0, limit);
}

export function searchStacks(query: string, limit = 20) {
  initializeSearch();
  const sqlite = getSqlite();
  const sanitized = query.replace(/['"]/g, "").trim();
  if (!sanitized) return [];

  return sqlite
    .prepare(
      `SELECT s.*, rank
       FROM stacks_fts f
       JOIN stacks s ON s.rowid = f.rowid
       WHERE stacks_fts MATCH ?
       ORDER BY rank
       LIMIT ?`,
    )
    .all(sanitized, limit);
}

export function updateStackSearchIndex(stackId: string): void {
  initializeSearch();
  const sqlite = getSqlite();
  sqlite.exec(`INSERT INTO stacks_fts(stacks_fts) VALUES('rebuild')`);
}
