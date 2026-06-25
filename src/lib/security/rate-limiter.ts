import { getSqlite } from "../db/connection";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
  blockedUntil: number;
}

const RATE_LIMIT_TABLE = "rate_limit_entries";
const inMemoryStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;

type LimitKey = "auth" | "api" | "search" | "compare" | "stack" | "analytics";

const DEFAULTS: Record<LimitKey, { windowMs: number; maxRequests: number }> = {
  auth: { windowMs: 900_000, maxRequests: 10 },
  api: { windowMs: 60_000, maxRequests: 60 },
  search: { windowMs: 60_000, maxRequests: 30 },
  compare: { windowMs: 60_000, maxRequests: 20 },
  stack: { windowMs: 60_000, maxRequests: 30 },
  analytics: { windowMs: 60_000, maxRequests: 100 },
};

export function checkRateLimit(opts: {
  identifier: string;
  limitKey: LimitKey;
  customConfig?: Partial<RateLimitConfig>;
  useDb?: boolean;
}): { allowed: boolean; remaining: number; resetAt: number; retryAfter?: number } {
  const config = { ...DEFAULTS[opts.limitKey], ...opts.customConfig };
  const key = `${opts.limitKey}:${opts.identifier}`;
  const now = Date.now();

  let entry = inMemoryStore.get(key);

  if (!entry || now > entry.windowStart + config.windowMs) {
    entry = { count: 0, windowStart: now, blockedUntil: 0 };
    inMemoryStore.set(key, entry);
  }

  if (now < entry.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  if (entry.count >= config.maxRequests) {
    entry.blockedUntil = now + config.windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter: Math.ceil(config.windowMs / 1000),
    };
  }

  entry.count++;

  if (opts.useDb && entry.count >= Math.ceil(config.maxRequests * 0.8)) {
    persistRateLimit(key, entry);
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.windowStart + config.windowMs,
  };
}

export function resetRateLimit(identifier: string, limitKey: LimitKey): void {
  const key = `${limitKey}:${identifier}`;
  inMemoryStore.delete(key);
}

export function clearExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore) {
    if (now > entry.windowStart + DEFAULTS.auth.windowMs && now > entry.blockedUntil) {
      inMemoryStore.delete(key);
    }
  }
}

function persistRateLimit(key: string, entry: RateLimitEntry): void {
  try {
    const sqlite = getSqlite();
    sqlite
      .prepare(
        `INSERT OR REPLACE INTO ${RATE_LIMIT_TABLE} (key, count, window_start, blocked_until, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(key, entry.count, entry.windowStart, entry.blockedUntil, Date.now());
  } catch {
    // table may not exist yet
  }
}

export function initializeRateLimitTable(): void {
  try {
    const sqlite = getSqlite();
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS ${RATE_LIMIT_TABLE} (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        window_start INTEGER NOT NULL,
        blocked_until INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      )
    `);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_rate_limit_updated ON ${RATE_LIMIT_TABLE}(updated_at)`);
  } catch {
    // already exists
  }
}

setInterval(clearExpiredEntries, CLEANUP_INTERVAL);
