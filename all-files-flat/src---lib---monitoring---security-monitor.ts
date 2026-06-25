import { db } from "../db";
import { securityEvents, systemLogs } from "../db/schema";
import { eq, and, gte, count } from "drizzle-orm";
import { sendAlert } from "./alert-manager";
import { captureBackendError } from "./sentry.server";
import { logSystemEvent } from "./system-logger";

const generateId = () => crypto.randomUUID();

const BRUTE_FORCE_THRESHOLD = 5;
const BRUTE_FORCE_WINDOW_MS = 15 * 60 * 1000;

export async function detectBruteForce(ip: string, email: string): Promise<boolean> {
  const since = new Date(Date.now() - BRUTE_FORCE_WINDOW_MS);
  const recentAttempts = await db.select({ count: count() })
    .from(systemLogs)
    .where(
      and(
        eq(systemLogs.event_type, "auth_error" as any),
        eq(systemLogs.ip_address, ip),
        gte(systemLogs.created_at, since),
      )
    );

  const attemptCount = Number(recentAttempts[0]?.count || 0);
  if (attemptCount >= BRUTE_FORCE_THRESHOLD) {
    await recordSecurityEvent({
      event_type: "brute_force",
      severity: "critical",
      ip_address: ip,
      description: `Brute force detected: ${attemptCount} failed login attempts from IP ${ip} targeting ${email}`,
      metadata: { email, attempt_count: attemptCount, window_minutes: BRUTE_FORCE_WINDOW_MS / 60000 },
    });
    return true;
  }
  return false;
}

export async function detectSuspiciousLogin(ip: string, userId: string, userAgent?: string) {
  const since = new Date(Date.now() - 3600000);
  const recentLogins = await db.select({ count: count() })
    .from(systemLogs)
    .where(
      and(
        eq(systemLogs.event_type, "login" as any),
        eq(systemLogs.user_id, userId),
        gte(systemLogs.created_at, since),
      )
    );

  if (Number(recentLogins[0]?.count || 0) > 10) {
    await recordSecurityEvent({
      event_type: "suspicious_login",
      severity: "warn",
      ip_address: ip,
      user_id: userId,
      description: `Suspicious login activity: ${recentLogins[0]?.count} logins in 1 hour from IP ${ip}`,
      metadata: { login_count: recentLogins[0]?.count, user_agent: userAgent },
    });
  }
}

export async function detectRepeatedFailure(email: string, ip: string) {
  const since = new Date(Date.now() - 300000);
  const recentFailures = await db.select({ count: count() })
    .from(systemLogs)
    .where(
      and(
        eq(systemLogs.event_type, "auth_error" as any),
        eq(systemLogs.ip_address, ip),
        gte(systemLogs.created_at, since),
      )
    );

  if (Number(recentFailures[0]?.count || 0) >= 5) {
    await recordSecurityEvent({
      event_type: "repeated_failure",
      severity: "warn",
      ip_address: ip,
      description: `Repeated auth failures for ${email}: ${recentFailures[0]?.count} in 5 minutes`,
      metadata: { email, failure_count: recentFailures[0]?.count, window_seconds: 300 },
    });
  }
}

export async function detectUnauthorizedAccess(ip: string, route: string, userId?: string) {
  await recordSecurityEvent({
    event_type: "unauthorized_access",
    severity: "warn",
    ip_address: ip,
    user_id: userId,
    description: `Unauthorized access attempt to ${route} from IP ${ip}`,
    metadata: { route },
  });
}

async function recordSecurityEvent(event: {
  event_type: string;
  severity: string;
  ip_address: string;
  user_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(securityEvents).values({
      id: generateId(),
      event_type: event.event_type,
      severity: event.severity,
      user_id: event.user_id || null,
      ip_address: event.ip_address,
      description: event.description,
      metadata: JSON.stringify(event.metadata || {}),
    });

    await sendAlert({
      alert_type: "security_incident",
      severity: event.severity as any,
      title: `Security: ${event.event_type.replace(/_/g, " ")}`,
      description: event.description,
      metadata: event.metadata,
    });
  } catch (err) {
    captureBackendError(err as Error, { context: "security-monitor", event });
  }
}

export async function getSecurityEvents(limit = 50, offset = 0) {
  const { desc } = await import("drizzle-orm");
  return db.select().from(securityEvents).orderBy(desc(securityEvents.created_at)).limit(limit).offset(offset);
}

export async function getUnresolvedSecurityEvents() {
  const { desc, eq } = await import("drizzle-orm");
  return db.select().from(securityEvents).where(eq(securityEvents.resolved, false)).orderBy(desc(securityEvents.created_at)).limit(20);
}

export async function resolveSecurityEvent(eventId: string) {
  await db.update(securityEvents).set({ resolved: true }).where(eq(securityEvents.id, eventId));
}

export async function getSecurityEventCountSince(since: Date) {
  const { gte } = await import("drizzle-orm");
  const result = await db.select({ c: count() }).from(securityEvents).where(gte(securityEvents.created_at, since));
  return Number(result[0]?.c || 0);
}
