import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { sendAlert } from "./alert-manager";

interface HealthStatus {
  status: "healthy" | "degraded" | "down";
  checks: HealthCheckResult[];
  lastChecked: string;
}

interface HealthCheckResult {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency: number;
  error?: string;
}

let lastHealthStatus: HealthStatus | null = null;
let consecutiveFailures: Record<string, number> = {};
const FAILURE_THRESHOLD = 3;

export async function checkWebsiteHealth(): Promise<HealthCheckResult> {
  const start = performance.now();
  try {
    const response = await fetch(typeof window !== "undefined" ? window.location.origin : "http://localhost:8080", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    const latency = performance.now() - start;
    return { name: "website", status: response.ok ? "healthy" : "degraded", latency: Math.round(latency) };
  } catch (err) {
    return { name: "website", status: "down", latency: -1, error: (err as Error).message };
  }
}

export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const start = performance.now();
  try {
    await db.select().from(users).limit(1);
    const latency = performance.now() - start;
    return { name: "database", status: "healthy", latency: Math.round(latency) };
  } catch (err) {
    return { name: "database", status: "down", latency: -1, error: (err as Error).message };
  }
}

export async function checkAuthHealth(): Promise<HealthCheckResult> {
  const start = performance.now();
  try {
    const { getCurrentSession } = await import("../../server/auth/session.server");
    await getCurrentSession();
    const latency = performance.now() - start;
    return { name: "authentication", status: "healthy", latency: Math.round(latency) };
  } catch (err) {
    return { name: "authentication", status: "degraded", latency: -1, error: (err as Error).message };
  }
}

export async function runHealthCheck(): Promise<HealthStatus> {
  const checks = await Promise.all([
    checkWebsiteHealth(),
    checkDatabaseHealth(),
    checkAuthHealth(),
  ]);

  const status: HealthStatus["status"] = checks.some(c => c.status === "down")
    ? "down"
    : checks.some(c => c.status === "degraded")
    ? "degraded"
    : "healthy";

  lastHealthStatus = { status, checks, lastChecked: new Date().toISOString() };

  for (const check of checks) {
    if (check.status === "down") {
      consecutiveFailures[check.name] = (consecutiveFailures[check.name] || 0) + 1;
      if (consecutiveFailures[check.name] >= FAILURE_THRESHOLD) {
        await sendAlert({
          alert_type: "downtime",
          severity: "critical",
          title: `${check.name} is DOWN`,
          description: `${check.name} health check failed ${consecutiveFailures[check.name]} times consecutively. Error: ${check.error}`,
          metadata: { check: check.name, failures: consecutiveFailures[check.name] },
        });
        consecutiveFailures[check.name] = 0;
      }
    } else {
      consecutiveFailures[check.name] = 0;
    }
  }

  return status;
}

export function getLastHealthStatus() {
  return lastHealthStatus;
}
