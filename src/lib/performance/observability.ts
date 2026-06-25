import { getSqlite } from "../db/connection";
import { getDb } from "../db/connection";
import { systemLogs } from "../db/schema";
import { lt } from "drizzle-orm";

interface TrackingEntry {
  path: string;
  method: string;
  durationMs: number;
  statusCode: number;
  timestamp: number;
  userId?: string;
}

const entries: TrackingEntry[] = [];
const MAX_ENTRIES = 5000;
const SLOW_API_THRESHOLD = 500;
const SLOW_PAGE_THRESHOLD = 2000;

export function trackRequest(path: string, method: string, durationMs: number, statusCode: number, userId?: string): void {
  entries.push({ path, method, durationMs, statusCode, timestamp: Date.now(), userId });
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);

  if (durationMs > SLOW_API_THRESHOLD && !path.startsWith("/_")) {
    console.warn(`[observability] SLOW ${method} ${path} - ${durationMs.toFixed(0)}ms`);
    logToDb(path, method, durationMs, statusCode, userId);
  }
}

function logToDb(path: string, method: string, durationMs: number, statusCode: number, userId?: string): void {
  try {
    const { logSystemEvent } = require("../monitoring/system-logger");
    logSystemEvent({
      event_type: "api_slow",
      severity: durationMs > 1000 ? "warn" : "info",
      user_id: userId || null,
      description: `Slow ${method} ${path} took ${durationMs.toFixed(0)}ms`,
      metadata: { path, method, duration_ms: durationMs, status_code: statusCode },
      ip_address: "internal",
    });
  } catch {
    // non-critical
  }
}

export function getSlowEndpoints(minDuration = SLOW_API_THRESHOLD, limit = 20) {
  const slow = entries.filter((e) => e.durationMs >= minDuration);
  const grouped = new Map<string, { count: number; total: number; max: number; paths: string[] }>();

  for (const e of slow) {
    const key = `${e.method} ${e.path}`;
    const g = grouped.get(key) || { count: 0, total: 0, max: 0, paths: [] };
    g.count++;
    g.total += e.durationMs;
    g.max = Math.max(g.max, e.durationMs);
    if (!g.paths.includes(e.path)) g.paths.push(e.path);
    grouped.set(key, g);
  }

  return [...grouped.entries()]
    .map(([key, data]) => ({
      endpoint: key,
      count: data.count,
      avgMs: Math.round(data.total / data.count),
      maxMs: data.max,
    }))
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, limit);
}

export function getTrafficStats(sinceMs = 3600000) {
  const now = Date.now();
  const recent = entries.filter((e) => now - e.timestamp < sinceMs);
  const byPath = new Map<string, number>();

  for (const e of recent) {
    byPath.set(e.path, (byPath.get(e.path) || 0) + 1);
  }

  const topPaths = [...byPath.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  const errors = recent.filter((e) => e.statusCode >= 400);
  const slow = recent.filter((e) => e.durationMs > SLOW_API_THRESHOLD);
  const pageViews = recent.filter((e) => e.method === "GET" && !e.path.startsWith("/api/"));

  return {
    totalRequests: recent.length,
    requestsPerMinute: Math.round((recent.length / (sinceMs / 60000))),
    errorCount: errors.length,
    slowRequestCount: slow.length,
    pageViews: pageViews.length,
    topPaths,
    timeWindow: `${sinceMs / 60000}min`,
  };
}

export function getSystemErrors(limit = 50) {
  return entries
    .filter((e) => e.statusCode >= 500)
    .slice(-limit)
    .reverse();
}

export function getCacheMissRate() {
  const cacheEntries = entries.filter((e) => e.path.includes("cache") || e.path.includes("miss"));
  if (cacheEntries.length === 0) return { rate: 0, total: 0 };
  const misses = cacheEntries.filter((e) => e.statusCode === 404 || e.durationMs > 200);
  return {
    rate: Math.round((misses.length / cacheEntries.length) * 100),
    total: cacheEntries.length,
    misses: misses.length,
  };
}

export async function pruneOldObservabilityData(): Promise<void> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  try {
    const d = getDb();
    await d.delete(systemLogs).where(lt(systemLogs.created_at, cutoff));
  } catch {
    // non-critical
  }
}

export function clearObservabilityData(): void {
  entries.length = 0;
}
