import { getDb, getSqlite } from "../db/connection";
import { getCacheHitRatio } from "../db/perf";
import { db } from "../db";

interface PerformanceSnapshot {
  timestamp: number;
  dbQueryCount: number;
  averageQueryTime: number;
  cacheHitRate: number;
  activeConnections: number;
  memoryUsage: number;
  pageLoads?: number;
}

const snapshots: PerformanceSnapshot[] = [];
let queryCount = 0;
let totalQueryTime = 0;
let pageLoads = 0;
let lastSnapshotTime = Date.now();

export function recordQuery(durationMs: number): void {
  queryCount++;
  totalQueryTime += durationMs;
}

export function recordPageLoad(): void {
  pageLoads++;
}

export function takeSnapshot(): PerformanceSnapshot {
  const elapsed = Date.now() - lastSnapshotTime;
  const snapshot: PerformanceSnapshot = {
    timestamp: Date.now(),
    dbQueryCount: queryCount,
    averageQueryTime: queryCount > 0 ? Math.round(totalQueryTime / queryCount) : 0,
    cacheHitRate: 0,
    activeConnections: 1,
    memoryUsage: process.memoryUsage?.().heapUsed || 0,
    pageLoads,
  };

  snapshots.push(snapshot);
  if (snapshots.length > 1440) snapshots.splice(0, snapshots.length - 1440);

  queryCount = 0;
  totalQueryTime = 0;
  pageLoads = 0;
  lastSnapshotTime = Date.now();

  return snapshot;
}

export function getPerformanceHistory(minutes = 60): PerformanceSnapshot[] {
  const since = Date.now() - minutes * 60 * 1000;
  return snapshots.filter((s) => s.timestamp >= since);
}

export function getCurrentPerformance() {
  const sqlite = getSqlite();
  const now = Date.now();
  const recentSnapshots = snapshots.filter((s) => now - s.timestamp < 300000);

  const avgQueryTime = recentSnapshots.length > 0
    ? Math.round(recentSnapshots.reduce((s, snap) => s + snap.averageQueryTime, 0) / recentSnapshots.length)
    : 0;

  const dbStats = getDbStats();

  return {
    averageQueryTime: avgQueryTime,
    totalQueries: queryCount,
    databaseSize: typeof dbStats.databaseSizeBytes === "number" ? dbStats.databaseSizeBytes : 0,
    cacheHitRate: recentSnapshots.length > 0
      ? Math.round(recentSnapshots.reduce((s, snap) => s + snap.cacheHitRate, 0) / recentSnapshots.length)
      : 0,
    memoryUsage: process.memoryUsage?.().heapUsed || 0,
    uptime: process.uptime(),
    snapshotCount: snapshots.length,
  };
}

setInterval(takeSnapshot, 60000);
