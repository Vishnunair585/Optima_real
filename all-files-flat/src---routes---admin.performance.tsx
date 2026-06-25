import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { getPerformanceDashboardDataFn, triggerSnapshotFn, runLoadTestFn, invalidateCacheTagFn, resetCircuitBreakerFn } from "../lib/api/performance.functions";

export const Route = createFileRoute("/admin/performance")({
  component: AdminPerformanceDashboard,
});

function MetricCard({ label, value, unit, trend, color }: { label: string; value: string | number; unit?: string; trend?: "up" | "down" | "good" | "bad"; color?: string }) {
  const trendColor = trend === "up" || trend === "bad" ? "text-red-500" : trend === "down" || trend === "good" ? "text-green-500" : "text-gray-400";
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "";
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 backdrop-blur-sm">
      <div className="text-sm text-gray-400">{label}</div>
      <div className={`mt-1 flex items-baseline gap-1.5 ${color || "text-white"}`}>
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      {trend && <div className={`mt-1 text-xs ${trendColor}`}>{arrow} {trend === "good" ? "Healthy" : trend === "bad" ? "Unhealthy" : ""}</div>}
    </div>
  );
}

function WebVitalBar({ name, good, needsImprovement, poor }: { name: string; good: number; needsImprovement: number; poor: number }) {
  const total = good + needsImprovement + poor;
  if (total === 0) return null;
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-300">{name}</span>
        <span className="text-gray-400">{total} samples</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-800">
        <div className="bg-green-500 transition-all" style={{ width: `${(good / total) * 100}%` }} />
        <div className="bg-yellow-500 transition-all" style={{ width: `${(needsImprovement / total) * 100}%` }} />
        <div className="bg-red-500 transition-all" style={{ width: `${(poor / total) * 100}%` }} />
      </div>
      <div className="mt-1 flex gap-4 text-xs text-gray-500">
        <span className="text-green-400">{good} good</span>
        <span className="text-yellow-400">{needsImprovement} needs work</span>
        <span className="text-red-400">{poor} poor</span>
      </div>
    </div>
  );
}

function SlowQueryTable({ queries }: { queries: { sql: string; durationMs: number; rows: number; timestamp: number }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-800/50">
          <tr>
            <th className="p-3 text-left text-gray-400">Query</th>
            <th className="p-3 text-right text-gray-400">Duration</th>
            <th className="p-3 text-right text-gray-400">Rows</th>
            <th className="p-3 text-right text-gray-400">Time</th>
          </tr>
        </thead>
        <tbody>
          {queries.map((q, i) => (
            <tr key={i} className="border-t border-gray-800">
              <td className="max-w-md truncate p-3 font-mono text-xs text-gray-300">{q.sql}</td>
              <td className={`p-3 text-right font-mono ${q.durationMs > 1000 ? "text-red-400" : "text-yellow-400"}`}>{q.durationMs.toFixed(0)}ms</td>
              <td className="p-3 text-right text-gray-400">{q.rows}</td>
              <td className="p-3 text-right text-gray-500">{new Date(q.timestamp).toLocaleTimeString()}</td>
            </tr>
          ))}
          {queries.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No slow queries recorded</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function LoadTestPanel() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ endpoint: "/", concurrentUsers: 10, totalRequests: 100 });

  const runTest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await runLoadTestFn({ data: config });
      setResult(res);
    } finally {
      setLoading(false);
    }
  }, [config]);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Load Test</h3>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <input className="rounded-lg border border-gray-700 bg-gray-800 p-2 text-sm text-white" placeholder="Endpoint" value={config.endpoint}
          onChange={(e) => setConfig({ ...config, endpoint: e.target.value })} />
        <input className="rounded-lg border border-gray-700 bg-gray-800 p-2 text-sm text-white" type="number" placeholder="Users" value={config.concurrentUsers}
          onChange={(e) => setConfig({ ...config, concurrentUsers: Number(e.target.value) })} />
        <input className="rounded-lg border border-gray-700 bg-gray-800 p-2 text-sm text-white" type="number" placeholder="Requests" value={config.totalRequests}
          onChange={(e) => setConfig({ ...config, totalRequests: Number(e.target.value) })} />
      </div>
      <button onClick={runTest} disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Running..." : "Run Load Test"}
      </button>

      {result && (
        <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-400">Avg:</span> <span className="text-white">{result.averageResponseTime}ms</span></div>
            <div><span className="text-gray-400">P95:</span> <span className="text-white">{result.p95ResponseTime}ms</span></div>
            <div><span className="text-gray-400">P99:</span> <span className="text-white">{result.p99ResponseTime}ms</span></div>
            <div><span className="text-gray-400">RPS:</span> <span className="text-white">{result.requestsPerSecond}</span></div>
            <div><span className="text-gray-400">Errors:</span> <span className={result.errorRate > 5 ? "text-red-400" : "text-green-400"}>{result.errorRate}%</span></div>
            <div><span className="text-gray-400">Success:</span> <span className="text-white">{result.successfulRequests}/{result.totalRequests}</span></div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-700">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${result.requestsPerSecond > 500 ? 100 : (result.requestsPerSecond / 500) * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function CircuitBreakerPanel({ circuits }: { circuits: Record<string, { state: string; failures: number; successes: number }> }) {
  const entries = Object.entries(circuits);
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Circuit Breakers</h3>
      {entries.length === 0 ? <p className="text-sm text-gray-500">No circuit breakers registered.</p> : (
        <div className="space-y-2">
          {entries.map(([name, data]) => (
            <div key={name} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/30 p-3">
              <div>
                <span className="text-sm text-white">{name}</span>
                <div className="mt-1 text-xs text-gray-400">{data.successes} successes, {data.failures} failures</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  data.state === "closed" ? "bg-green-900/50 text-green-400" :
                  data.state === "half-open" ? "bg-yellow-900/50 text-yellow-400" :
                  "bg-red-900/50 text-red-400"
                }`}>{data.state}</span>
                {data.state !== "closed" && (
                  <button onClick={() => resetCircuitBreakerFn({ data: { name } })}
                    className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600">Reset</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CachePanel({ cache }: { cache: { size: number; hits: number; misses: number; hitRate: number; maxEntries: number } }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Cache</h3>
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Entries" value={cache.size} unit={`/ ${cache.maxEntries}`} />
        <MetricCard label="Hit Rate" value={`${(cache.hitRate * 100).toFixed(1)}%`} trend={cache.hitRate > 0.8 ? "good" : "bad"} />
        <MetricCard label="Hits" value={cache.hits} />
        <MetricCard label="Misses" value={cache.misses} />
      </div>
      {cache.size > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-700">
          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(cache.size / cache.maxEntries) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function AdminPerformanceDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "vitals" | "queries" | "cache" | "loadtest" | "circuits">("overview");

  useEffect(() => {
    getPerformanceDashboardDataFn().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-400">Loading performance data...</div>;
  if (!data) return <div className="flex h-64 items-center justify-center text-red-400">Failed to load performance data</div>;

  const { performance, webVitals, database, cache, queue, circuits, slowQueries, counts } = data;

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "vitals" as const, label: "Core Web Vitals" },
    { id: "queries" as const, label: "Slow Queries" },
    { id: "cache" as const, label: "Cache" },
    { id: "loadtest" as const, label: "Load Test" },
    { id: "circuits" as const, label: "Circuit Breakers" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Performance Dashboard</h1>
            <p className="mt-1 text-gray-400">Real-time performance monitoring & load testing</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <div className="text-gray-400">Lighthouse Score</div>
              <div className={`text-2xl font-bold ${webVitals.lighthouseScore >= 90 ? "text-green-400" : webVitals.lighthouseScore >= 70 ? "text-yellow-400" : "text-red-400"}`}>
                {webVitals.lighthouseScore}/100
              </div>
            </div>
            <button onClick={() => { setLoading(true); getPerformanceDashboardDataFn().then(setData).finally(() => setLoading(false)); }}
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Refresh</button>
          </div>
        </div>

        <div className="mb-6 flex gap-2 border-b border-gray-800">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${tab === t.id ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400 hover:text-gray-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <MetricCard label="Avg Query Time" value={database.slowQueryCount || performance.averageQueryTime} unit="ms" trend={performance.averageQueryTime < 100 ? "good" : "bad"} />
              <MetricCard label="DB Size" value={database.databaseSizeMb || "0"} unit="MB" />
              <MetricCard label="Queue Jobs" value={queue.total || 0} />
              <MetricCard label="Cache Hit Rate" value={`${(cache.hitRate * 100).toFixed(0)}%`} trend={cache.hitRate > 0.8 ? "good" : "bad"} />
            </div>

            <div className="mb-8 grid grid-cols-3 gap-4">
              <MetricCard label="Total Users" value={counts.users} />
              <MetricCard label="Total Stacks" value={counts.stacks} />
              <MetricCard label="Comparisons" value={counts.comparisons} />
            </div>

            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <MetricCard label="Fragmentation" value={`${database.fragmentationPct || "0"}%`} trend={Number(database.fragmentationPct || 0) > 20 ? "bad" : "good"} />
              <MetricCard label="Slow Queries (1s+)" value={database.slowQueryCount || 0} trend={Number(database.slowQueryCount || 0) > 0 ? "bad" : "good"} />
              <MetricCard label="Total Tables" value={database.tableCount || 0} />
              <MetricCard label="Uptime" value={Math.round(performance.uptime / 3600)} unit="hours" />
            </div>

            {slowQueries.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-3 text-lg font-semibold text-white">Recent Slow Queries (&gt;500ms)</h3>
                <SlowQueryTable queries={slowQueries} />
              </div>
            )}

            {history.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-3 text-lg font-semibold text-white">Query Performance (60min)</h3>
                <div className="flex items-end gap-1" style={{ height: 120 }}>
                  {history.map((s: any, i: number) => (
                    <div key={i} className="flex flex-1 flex-col items-center justify-end"
                      title={`${s.averageQueryTime}ms avg`}>
                      <div className="w-full rounded-t"
                        style={{
                          height: `${Math.min(s.averageQueryTime / 2, 100)}px`,
                          backgroundColor: s.averageQueryTime > 200 ? "#ef4444" : s.averageQueryTime > 100 ? "#eab308" : "#22c55e",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === "vitals" && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="mb-6 text-xl font-semibold text-white">Core Web Vitals</h2>
            <div className="mb-6">
              <div className="mb-2 text-4xl font-bold text-white">{webVitals.lighthouseScore}</div>
              <div className="text-sm text-gray-400">Estimated Lighthouse Score</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(webVitals.summary || {}).map(([name, data]: [string, any]) => (
                <WebVitalBar key={name} name={name} good={data.good} needsImprovement={data.needsImprovement} poor={data.poor} />
              ))}
            </div>
            {Object.keys(webVitals.summary || {}).length === 0 && (
              <p className="text-gray-500">No web vitals data collected yet. Load pages in the browser to start collecting.</p>
            )}
          </div>
        )}

        {tab === "queries" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Slow Queries</h2>
              <span className="text-sm text-gray-400">{slowQueries.length} recorded</span>
            </div>
            <SlowQueryTable queries={slowQueries} />
          </div>
        )}

        {tab === "cache" && <CachePanel cache={cache} />}

        {tab === "loadtest" && <LoadTestPanel />}

        {tab === "circuits" && <CircuitBreakerPanel circuits={circuits} />}
      </div>
    </div>
  );
}
