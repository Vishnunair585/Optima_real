import { db } from "../db";
import { systemLogs } from "../db/schema";
import { captureBackendError } from "./sentry.server";

const generateId = () => crypto.randomUUID();

type Severity = "debug" | "info" | "warn" | "error" | "critical";
type EventType =
  | "login"
  | "signup"
  | "oauth"
  | "admin_action"
  | "db_operation"
  | "subscription"
  | "security"
  | "api_error"
  | "stripe_error"
  | "auth_error"
  | "deployment";

export interface LogEntry {
  event_type: EventType;
  severity?: Severity;
  user_id?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
  ip_address?: string | null;
  user_agent?: string | null;
}

export async function logSystemEvent(entry: LogEntry) {
  try {
    await db.insert(systemLogs).values({
      id: generateId(),
      event_type: entry.event_type,
      severity: entry.severity || "info",
      user_id: entry.user_id || null,
      description: entry.description,
      metadata: JSON.stringify(entry.metadata || {}),
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
    });
  } catch (err) {
    console.error("[system-logger] Failed to write log:", err);
    captureBackendError(err as Error, { context: "system-logger", entry });
  }
}

export async function getRecentLogs(limit = 100, offset = 0) {
  const { desc } = await import("drizzle-orm");
  return db.select().from(systemLogs).orderBy(desc(systemLogs.created_at)).limit(limit).offset(offset);
}

export async function getLogsByType(eventType: string, limit = 50) {
  const { eq, desc } = await import("drizzle-orm");
  return db.select().from(systemLogs).where(eq(systemLogs.event_type, eventType as any)).orderBy(desc(systemLogs.created_at)).limit(limit);
}

export async function getLogsBySeverity(severity: Severity, limit = 50) {
  const { eq, desc } = await import("drizzle-orm");
  return db.select().from(systemLogs).where(eq(systemLogs.severity, severity)).orderBy(desc(systemLogs.created_at)).limit(limit);
}

export async function getLogCountSince(since: Date) {
  const { count, gte } = await import("drizzle-orm");
  const result = await db.select({ count: count() }).from(systemLogs).where(gte(systemLogs.created_at, since));
  return Number(result[0]?.count || 0);
}

export async function getErrorCountSince(since: Date) {
  const { count, gte, inArray } = await import("drizzle-orm");
  const result = await db.select({ count: count() }).from(systemLogs).where(
    and(gte(systemLogs.created_at, since), inArray(systemLogs.severity, ["error", "critical"] as any))
  );
  return Number(result[0]?.count || 0);
}

import { and } from "drizzle-orm";
