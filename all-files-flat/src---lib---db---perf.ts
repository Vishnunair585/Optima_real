import { getDb, getSqlite } from "./connection";
import { sql } from "drizzle-orm";

export interface QueryPlan {
  id: number;
  parent: number;
  notused: number;
  detail: string;
}

export interface SlowQuery {
  sql: string;
  durationMs: number;
  timestamp: number;
  rows: number;
  stackTrace?: string;
}

const slowQueries: SlowQuery[] = [];
const MAX_SLOW_LOG = 500;
const SLOW_THRESHOLD_MS = 200;

export function explainQuery(query: string): QueryPlan[] {
  const sqlite = getSqlite();
  try {
    return sqlite.prepare(`EXPLAIN QUERY PLAN ${query}`).all() as QueryPlan[];
  } catch {
    return [];
  }
}

export function getTableStats() {
  const sqlite = getSqlite();
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
  return tables.map((t) => {
    const count = sqlite.prepare(`SELECT COUNT(*) as cnt FROM "${t.name}"`).get() as { cnt: number };
    const size = sqlite.prepare(`SELECT COUNT(*) as pages FROM sqlite_master WHERE type='table' AND name='${t.name}'`).get() as { pages: number };
    return { name: t.name, rows: count.cnt };
  });
}

export function getMissingIndexes(): string[] {
  const sqlite = getSqlite();
  const suggestions: string[] = [];

  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_fts%'").all() as { name: string }[];

  for (const t of tables) {
    const cols = sqlite.prepare(`PRAGMA table_info("${t.name}")`).all() as { name: string; pk: number }[];
    const indexes = sqlite.prepare(`PRAGMA index_list("${t.name}")`).all() as { name: string }[];
    const indexedCols = new Set<string>();
    for (const idx of indexes) {
      const info = sqlite.prepare(`PRAGMA index_info("${idx.name}")`).all() as { name: string }[];
      for (const i of info) indexedCols.add(i.name);
    }

    for (const col of cols) {
      if (col.pk) continue;
      if (col.name.endsWith("_id") && !indexedCols.has(col.name)) {
        suggestions.push(`"${t.name}"."${col.name}"`);
      }
    }

    if (cols.some((c) => c.name === "status") && !indexedCols.has("status")) {
      suggestions.push(`"${t.name}"."status"`);
    }
    if (cols.some((c) => c.name === "created_at") && !indexedCols.has("created_at")) {
      suggestions.push(`"${t.name}"."created_at"`);
    }
  }

  return suggestions;
}

export function getUsedIndexes(): { table: string; index: string; detail: string }[] {
  const sqlite = getSqlite();
  const indexes = sqlite.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL").all() as { name: string; tbl_name: string; sql: string }[];
  return indexes.map((i) => ({
    table: i.tbl_name,
    index: i.name,
    detail: i.sql,
  }));
}

export function recordSlowQuery(sqlText: string, durationMs: number, rows: number, stackTrace?: string): void {
  if (durationMs < SLOW_THRESHOLD_MS) return;
  slowQueries.push({ sql: sqlText, durationMs, rows, timestamp: Date.now(), stackTrace });
  if (slowQueries.length > MAX_SLOW_LOG) slowQueries.splice(0, slowQueries.length - MAX_SLOW_LOG);
}

export function getSlowQueries(minDurationMs = SLOW_THRESHOLD_MS, limit = 50): SlowQuery[] {
  return slowQueries.filter((q) => q.durationMs >= minDurationMs).slice(-limit).reverse();
}

export function resetSlowQueries(): void {
  slowQueries.length = 0;
}

export function analyzeQueryPerformance(sqlText: string) {
  const plan = explainQuery(sqlText);
  const tableScans = plan.filter((p) => p.detail.includes("SCAN"));
  const usesIndex = plan.some((p) => p.detail.includes("USING INDEX") || p.detail.includes("USING COVERING INDEX"));
  const usesTempBtree = plan.some((p) => p.detail.includes("USE TEMP B-TREE"));

  return {
    plan,
    tableScans: tableScans.length,
    usesIndex,
    usesTempBtree,
    isOptimal: !tableScans.length && !usesTempBtree,
    recommendations: [
      ...(tableScans.length ? [`${tableScans.length} table scan(s) detected — consider adding indexes`] : []),
      ...(usesTempBtree ? ["Temporary B-TREE used — consider adding a composite index for sorting"] : []),
    ],
  };
}

export function getCacheHitRatio() {
  const sqlite = getSqlite();
  const stmt = sqlite.prepare("PRAGMA cache_spill").get();
  return { cacheSpillMode: stmt };
}

export function getDbPerformanceSummary() {
  const sqlite = getSqlite();
  const pageCount = (sqlite.prepare("PRAGMA page_count").get() as Record<string, number>).page_count;
  const pageSize = (sqlite.prepare("PRAGMA page_size").get() as Record<string, number>).page_size;
  const freelist = (sqlite.prepare("PRAGMA freelist_count").get() as Record<string, number>).freelist_count;

  return {
    databaseSizeMb: ((pageCount * pageSize) / 1024 / 1024).toFixed(2),
    pageCount,
    freelistPages: freelist,
    fragmentationPct: pageCount > 0 ? ((freelist / pageCount) * 100).toFixed(1) : "0",
    slowQueryCount: slowQueries.filter((q) => q.durationMs > 1000).length,
    totalSlowQueries: slowQueries.length,
    tableCount: getTableStats().length,
  };
}
