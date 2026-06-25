const measurements: Map<string, { start: number; info: Record<string, unknown> }> = new Map();

const SLOW_THRESHOLD_MS = 500;

export function startMeasure(label: string, info?: Record<string, unknown>) {
  measurements.set(label, { start: performance.now(), info: info || {} });
}

export function endMeasure(label: string, extra?: Record<string, unknown>): number {
  const m = measurements.get(label);
  if (!m) return 0;
  const duration = performance.now() - m.start;
  measurements.delete(label);

  if (duration > SLOW_THRESHOLD_MS) {
    console.warn(`[perf] SLOW: ${label} took ${duration.toFixed(1)}ms`, { ...m.info, ...extra });
    if (typeof window !== "undefined") {
      reportWebVital("slow_operation", duration, { label, ...m.info, ...extra });
    }
  }

  return Math.round(duration);
}

export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
  info?: Record<string, unknown>
): Promise<T> {
  startMeasure(label, info);
  try {
    return await fn();
  } finally {
    endMeasure(label);
  }
}

type VitalName = "api_response" | "db_query" | "page_load" | "slow_operation";
const vitalLog: { name: VitalName; value: number; tags: Record<string, unknown>; timestamp: number }[] = [];
const MAX_VITALS = 1000;

export function reportWebVital(name: VitalName, value: number, tags?: Record<string, unknown>) {
  vitalLog.push({ name, value, tags: tags || {}, timestamp: Date.now() });
  if (vitalLog.length > MAX_VITALS) vitalLog.splice(0, vitalLog.length - MAX_VITALS);
}

export function getRecentVitals(limit = 100) {
  return vitalLog.slice(-limit).reverse();
}

export function getAverageApiResponseTime(sinceMs = 60000) {
  const now = Date.now();
  const recent = vitalLog.filter(v => v.name === "api_response" && now - v.timestamp < sinceMs);
  if (recent.length === 0) return 0;
  return Math.round(recent.reduce((sum, v) => sum + v.value, 0) / recent.length);
}

export function getSlowQueryCount(sinceMs = 300000) {
  const now = Date.now();
  return vitalLog.filter(v => v.name === "db_query" && v.value > SLOW_THRESHOLD_MS && now - v.timestamp < sinceMs).length;
}
