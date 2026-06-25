import { getSqlite } from "../db/connection";
import { v4 as uuid } from "uuid";

type JobHandler = (payload: unknown) => Promise<void>;

interface JobDefinition {
  handler: JobHandler;
  concurrency?: number;
  retries?: number;
  retryDelayMs?: number;
}

const handlers = new Map<string, JobDefinition>();
const runningJobs = new Map<string, Promise<void>>();
let polling = false;
let pollInterval: ReturnType<typeof setInterval> | null = null;

const QUEUE_TABLE = "job_queue";

export function initializeQueue(): void {
  const sqlite = getSqlite();
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS ${QUEUE_TABLE} (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      priority INTEGER NOT NULL DEFAULT 0,
      retries INTEGER NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 3,
      scheduled_at INTEGER,
      started_at INTEGER,
      completed_at INTEGER,
      error TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_job_queue_status ON ${QUEUE_TABLE}(status, priority DESC, created_at)`);
}

export function registerJob(type: string, def: JobDefinition): void {
  handlers.set(type, def);
}

export async function enqueue(type: string, payload: unknown, opts?: { priority?: number; maxRetries?: number; scheduledAt?: number }): Promise<string> {
  const sqlite = getSqlite();
  const id = uuid();
  sqlite
    .prepare(
      `INSERT INTO ${QUEUE_TABLE} (id, type, payload, status, priority, max_retries, scheduled_at, created_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, strftime('%s', 'now'))`,
    )
    .run(id, type, JSON.stringify(payload), opts?.priority ?? 0, opts?.maxRetries ?? 3, opts?.scheduledAt ?? Math.floor(Date.now() / 1000));
  return id;
}

export async function getJobStatus(jobId: string): Promise<{ status: string; error?: string } | null> {
  const sqlite = getSqlite();
  const row = sqlite.prepare(`SELECT status, error FROM ${QUEUE_TABLE} WHERE id = ?`).get(jobId) as { status: string; error: string | null } | undefined;
  if (!row) return null;
  return { status: row.status, error: row.error ?? undefined };
}

export async function processNext(): Promise<boolean> {
  const sqlite = getSqlite();
  const now = Math.floor(Date.now() / 1000);

  const job = sqlite
    .prepare(
      `UPDATE ${QUEUE_TABLE}
       SET status = 'running', started_at = ?
       WHERE id = (
         SELECT id FROM ${QUEUE_TABLE}
         WHERE status = 'pending' AND (scheduled_at IS NULL OR scheduled_at <= ?)
         ORDER BY priority DESC, created_at ASC
         LIMIT 1
       )
       RETURNING *`,
    )
    .get(now, now) as Record<string, unknown> | undefined;

  if (!job) return false;

  const def = handlers.get(job.type as string);
  if (!def) {
    sqlite
      .prepare(`UPDATE ${QUEUE_TABLE} SET status = 'failed', error = ?, completed_at = ? WHERE id = ?`)
      .run(`No handler registered for job type: ${job.type}`, now, job.id);
    return true;
  }

  const runJob = async () => {
    let lastError: Error | undefined;
    const maxRetries = (job.max_retries as number) ?? def.retries ?? 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const payload = typeof job.payload === "string" ? JSON.parse(job.payload as string) : job.payload;
        await def.handler(payload);
        sqlite
          .prepare(`UPDATE ${QUEUE_TABLE} SET status = 'completed', completed_at = ?, retries = ? WHERE id = ?`)
          .run(Math.floor(Date.now() / 1000), attempt, job.id);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          const delay = (def.retryDelayMs ?? 1000) * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    sqlite
      .prepare(`UPDATE ${QUEUE_TABLE} SET status = 'failed', error = ?, completed_at = ?, retries = ? WHERE id = ?`)
      .run(lastError?.message ?? "Unknown error", Math.floor(Date.now() / 1000), maxRetries, job.id);
  };

  const promise = runJob().finally(() => {
    runningJobs.delete(job.id as string);
  });
  runningJobs.set(job.id as string, promise);

  return true;
}

export async function processAll(): Promise<void> {
  while (await processNext()) {
    // continue processing
  }
}

export function startPolling(intervalMs = 1000): void {
  if (polling) return;
  polling = true;
  pollInterval = setInterval(async () => {
    if (!polling) return;
    try {
      await processNext();
    } catch {
      // polling continues
    }
  }, intervalMs);
  if (pollInterval && typeof pollInterval === "object" && "unref" in pollInterval) {
    (pollInterval as NodeJS.Timeout).unref();
  }
}

export function stopPolling(): void {
  polling = false;
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

export function getQueueStats() {
  const sqlite = getSqlite();
  const counts = sqlite
    .prepare(
      `SELECT status, COUNT(*) as count FROM ${QUEUE_TABLE} GROUP BY status`,
    )
    .all() as { status: string; count: number }[];
  const total = counts.reduce((sum, r) => sum + r.count, 0);
  const statusMap: Record<string, number> = {};
  for (const r of counts) statusMap[r.status] = r.count;
  return { total, ...statusMap, running: runningJobs.size };
}

export async function waitForAll(): Promise<void> {
  await Promise.all([...runningJobs.values()]);
}
