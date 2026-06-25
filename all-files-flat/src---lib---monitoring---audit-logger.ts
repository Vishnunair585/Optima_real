import { db } from "../db";
import { auditLogs } from "../db/schema";
import { captureBackendError } from "./sentry.server";

const generateId = () => crypto.randomUUID();

type AuditAction =
  | "tool.created"
  | "tool.updated"
  | "tool.deleted"
  | "comparison.created"
  | "stack.created"
  | "stack.updated"
  | "stack.deleted"
  | "user.role_changed"
  | "subscription.changed"
  | "admin.changed";

type EntityType = "tool" | "user" | "subscription" | "comparison" | "stack";

export interface AuditEntry {
  action: AuditAction;
  entity_type: EntityType;
  entity_id: string;
  actor_id?: string | null;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ip_address?: string | null;
}

export async function writeAuditLog(entry: AuditEntry) {
  try {
    await db.insert(auditLogs).values({
      id: generateId(),
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      actor_id: entry.actor_id || null,
      changes: JSON.stringify(entry.changes || {}),
      ip_address: entry.ip_address || null,
    });
  } catch (err) {
    console.error("[audit-logger] Failed to write audit log:", err);
    captureBackendError(err as Error, { context: "audit-logger", entry });
  }
}

export async function getAuditLogs(limit = 100, offset = 0) {
  const { desc } = await import("drizzle-orm");
  return db.select().from(auditLogs).orderBy(desc(auditLogs.created_at)).limit(limit).offset(offset);
}

export async function getAuditLogsByEntity(entityType: string, entityId: string) {
  const { eq, desc, and } = await import("drizzle-orm");
  return db.select().from(auditLogs)
    .where(and(eq(auditLogs.entity_type, entityType as any), eq(auditLogs.entity_id, entityId)))
    .orderBy(desc(auditLogs.created_at))
    .limit(50);
}

export async function getAuditLogsByActor(actorId: string, limit = 50) {
  const { eq, desc } = await import("drizzle-orm");
  return db.select().from(auditLogs).where(eq(auditLogs.actor_id, actorId)).orderBy(desc(auditLogs.created_at)).limit(limit);
}
