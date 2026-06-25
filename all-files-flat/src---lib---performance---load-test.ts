import { db } from "../db";
import { getSqlite } from "../db/connection";

interface LoadTestResult {
  endpoint: string;
  concurrentUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  duration: number;
}

export interface LoadTestConfig {
  endpoint: string;
  concurrentUsers: number;
  totalRequests: number;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
}

async function simulateRequest(config: LoadTestConfig): Promise<{ duration: number; success: boolean; error?: string }> {
  const start = performance.now();
  try {
    const response = await fetch(config.endpoint, {
      method: config.method || "GET",
      headers: { "Content-Type": "application/json", ...config.headers },
      body: config.body ? JSON.stringify(config.body) : undefined,
    });
    const duration = performance.now() - start;
    return { duration, success: response.ok };
  } catch (err) {
    return { duration: performance.now() - start, success: false, error: String(err) };
  }
}

export async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  const durations: number[] = [];
  let successful = 0;
  let failed = 0;

  const startTime = Date.now();
  const batchSize = Math.min(config.concurrentUsers, 50);

  const runBatch = async (): Promise<void> => {
    const batch = Array.from({ length: batchSize }, () => simulateRequest(config));
    const results = await Promise.all(batch);
    for (const r of results) {
      durations.push(r.duration);
      if (r.success) successful++;
      else failed++;
    }
  };

  const batches = Math.ceil(config.totalRequests / batchSize);
  for (let i = 0; i < batches; i++) {
    await runBatch();
  }

  const duration = Date.now() - startTime;
  durations.sort((a, b) => a - b);

  return {
    endpoint: config.endpoint,
    concurrentUsers: config.concurrentUsers,
    totalRequests: config.totalRequests,
    successfulRequests: successful,
    failedRequests: failed,
    averageResponseTime: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length),
    p50ResponseTime: durations[Math.floor(durations.length * 0.5)] || 0,
    p95ResponseTime: durations[Math.floor(durations.length * 0.95)] || 0,
    p99ResponseTime: durations[Math.floor(durations.length * 0.99)] || 0,
    maxResponseTime: durations[durations.length - 1] || 0,
    minResponseTime: durations[0] || 0,
    requestsPerSecond: Math.round((config.totalRequests / duration) * 1000),
    errorRate: Math.round((failed / config.totalRequests) * 100),
    duration,
  };
}

export async function runFullLoadTestSuite(): Promise<LoadTestResult[]> {
  const results: LoadTestResult[] = [];
  const origin = process.env.PUBLIC_URL || "http://localhost:8080";

  const testCases: LoadTestConfig[] = [
    { endpoint: `${origin}/`, concurrentUsers: 10, totalRequests: 100 },
    { endpoint: `${origin}/leaderboard`, concurrentUsers: 10, totalRequests: 100 },
    { endpoint: `${origin}/api/health`, concurrentUsers: 50, totalRequests: 500 },
    { endpoint: `${origin}/api/stacks`, concurrentUsers: 20, totalRequests: 200 },
    { endpoint: `${origin}/api/compare`, concurrentUsers: 20, totalRequests: 200 },
  ];

  for (const testCase of testCases) {
    const result = await runLoadTest(testCase);
    results.push(result);
  }

  return results;
}

export function generateLoadTestReport(results: LoadTestResult[]): string {
  let report = "# Load Test Report\n\n";
  report += `| Endpoint | Users | Requests | Avg (ms) | P50 | P95 | P99 | RPS | Errors |\n`;
  report += `|---|---|---|---|---|---|---|---|---|\n`;

  for (const r of results) {
    report += `| ${r.endpoint} | ${r.concurrentUsers} | ${r.totalRequests} | ${r.averageResponseTime} | ${r.p50ResponseTime} | ${r.p95ResponseTime} | ${r.p99ResponseTime} | ${r.requestsPerSecond} | ${r.errorRate}% |\n`;
  }

  const allOk = results.every((r) => r.errorRate < 5);
  const allFast = results.every((r) => r.averageResponseTime < 500);

  report += `\n## Summary\n\n`;
  report += `- **Status:** ${allOk && allFast ? "✅ PASS" : "⚠️ NEEDS IMPROVEMENT"}\n`;
  report += `- **Overall average response time:** ${Math.round(results.reduce((s, r) => s + r.averageResponseTime, 0) / results.length)}ms\n`;
  report += `- **Overall error rate:** ${Math.round(results.reduce((s, r) => s + r.errorRate, 0) / results.length)}%\n`;

  return report;
}
