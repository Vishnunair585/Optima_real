import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

let _sqlite: Database.Database | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getSqlite(): Database.Database {
  if (!_sqlite) {
    _sqlite = new Database(process.env.DATABASE_URL || "sqlite.db");
    _sqlite.pragma("journal_mode = WAL");
    _sqlite.pragma("synchronous = NORMAL");
    _sqlite.pragma("cache_size = -64000");
    _sqlite.pragma("busy_timeout = 5000");
    _sqlite.pragma("foreign_keys = ON");
    _sqlite.pragma("temp_store = MEMORY");
    _sqlite.pragma("mmap_size = 30000000000");
  }
  return _sqlite;
}

export function getDb(): ReturnType<typeof drizzle> {
  if (!_db) {
    _db = drizzle(getSqlite(), { schema });
  }
  return _db;
}

export function closeConnection(): void {
  if (_sqlite) {
    _sqlite.close();
    _sqlite = null;
    _db = null;
  }
}

export function resetConnectionForTest(): void {
  closeConnection();
}

export function getDbStats() {
  const sqlite = getSqlite();
  const walSize = sqlite.prepare("PRAGMA wal_checkpoint(TRUNCATE)").get();
  const pageCount = sqlite.prepare("PRAGMA page_count").get() as { page_count: number };
  const pageSize = sqlite.prepare("PRAGMA page_size").get() as { page_size: number };
  const freelistCount = sqlite.prepare("PRAGMA freelist_count").get() as { freelist_count: number };
  return {
    databaseSizeBytes: pageCount.page_count * pageSize.page_size,
    pageCount: pageCount.page_count,
    pageSize: pageSize.page_size,
    freelistPages: freelistCount.freelist_count,
    walMode: true,
  };
}
