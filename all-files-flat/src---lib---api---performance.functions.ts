import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";
import { count } from "drizzle-orm";
import { users, stacks, toolComparisons } from "../db/schema";
import { getPerformanceHistory, getCurrentPerformance, takeSnapshot } from "../performance/observer";
import { getWebVitals, getWebVitalSummary, getLighthouseScore } from "../performance/web-vitals";
import { getDbPerformanceSummary, getSlowQueries, getTableStats, resetSlowQueries } from "../db/perf";
import { getCacheHitRatio } from "../db/perf";
import { globalCache } from "../cache";
import { runLoadTest, generateLoadTestReport, type LoadTestConfig } from "../performance/load-test";
import { circuitBreaker } from "../performance/circuit-breaker";
import { getQueueStats } from "../queue";

async function getSession() {
  const { getCurrentSession } = await import("../../server/auth/session.server");
  return getCurrentSession();
}

async function requireAdmin(): Promise<string> {
  const authData = await getSession();
  if (!authData) throw new Error("Authentication required.");
  const { requireAdminAccess } = await import("../security/authz");
  await requireAdminAccess(authData.user.id);
  return authData.user.id;
}

export const getPerformanceDashboardDataFn = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireAdmin();

    const [perf, vitalsSummary, dbPerf, cacheStats, queueStats, circuitStats, dbSummary, userCount, stackCount, comparisonCount] = await Promise.all([
      getCurrentPerformance(),
      getWebVitalSummary(),
      getDbPerformanceSummary(),
      globalCache.getStats(),
      getQueueStats(),
      circuitBreaker.getStats(),
      getDbPerformanceSummary(),
      db.select({ count: count() }).from(users).then(r => Number(r[0]?.count || 0)),
      db.select({ count: count() }).from(stacks).then(r => Number(r[0]?.count || 0)),
      db.select({ count: count() }).from(toolComparisons).then(r => Number(r[0]?.count || 0)),
    ]);

    const recentVitals = getWebVitals(20);
    const slowQueries = getSlowQueries(500, 20);
    const history = getPerformanceHistory(60);
    const lighthouseScore = getLighthouseScore();

    return {
      performance: perf,
      webVitals: { summary: vitalsSummary, recent: recentVitals, lighthouseScore },
      database: dbPerf,
      cache: cacheStats,
      queue: queueStats,
      circuits: circuitStats,
      slowQueries,
      history,
      counts: { users: userCount, stacks: stackCount, comparisons: comparisonCount },
    };
  });

export const triggerSnapshotFn = createServerFn({ method: "POST" })
  .handler(async () => {
    await requireAdmin();
    return takeSnapshot();
  });

export const runLoadTestFn = createServerFn({ method: "POST" })
  .validator(z.object({
    endpoint: z.string(),
    concurrentUsers: z.number().min(1).max(100),
    totalRequests: z.number().min(1).max(1000),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const result = await runLoadTest(data);
    return result;
  });

export const runFullTestSuiteFn = createServerFn({ method: "POST" })
  .handler(async () => {
    await requireAdmin();
    const results = await runFullLoadTestSuite();
    const report = generateLoadTestReport(results);
    return { results, report };
  });

export const getSlowQueriesFn = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireAdmin();
    return getSlowQueries(200, 50);
  });

export const getCircuitBreakerStatusFn = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireAdmin();
    return circuitBreaker.getStats();
  });

export const resetCircuitBreakerFn = createServerFn({ method: "POST" })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    circuitBreaker.reset(data.name);
    return { success: true };
  });

export const getCacheStatsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireAdmin();
    return globalCache.getStats();
  });

export const invalidateCacheTagFn = createServerFn({ method: "POST" })
  .validator(z.object({ tag: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    globalCache.invalidateTag(data.tag);
    return { success: true };
  });
