import { getDb } from "./connection";
export const db = getDb();
export { getSqlite, closeConnection, getDbStats } from "./connection";
export { initializeSearch, searchAll, searchStacks, rebuildSearchIndexes } from "./search";
export { buildCursorQuery, formatCursorResult } from "./cursor-pagination";
export { analyzeQueryPerformance, getTableStats, getMissingIndexes, getSlowQueries, recordSlowQuery, getDbPerformanceSummary } from "./perf";
export type { CursorPaginationParams, CursorPaginationResult, CursorDirection, CursorOrder } from "./cursor-pagination";
export type { QueryPlan, SlowQuery } from "./perf";
