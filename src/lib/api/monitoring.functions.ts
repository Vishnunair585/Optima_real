import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";
import { users, alertHistory } from "../db/schema";
import { count } from "drizzle-orm";
import { getRecentLogs, getErrorCountSince } from "../monitoring/system-logger";
import { getRecentAlerts, getUnacknowledgedAlerts } from "../monitoring/alert-manager";
import { getUnresolvedSecurityEvents, getSecurityEventCountSince } from "../monitoring/security-monitor";
import { getBackupHistory, getLatestBackup, runBackup, restoreBackup } from "../monitoring/backup-manager";
import { runHealthCheck } from "../monitoring/uptime-monitor";
import { getVersionInfo } from "../monitoring/version";
import { sendAlert, acknowledgeAlert } from "../monitoring/alert-manager";
import { resolveSecurityEvent } from "../monitoring/security-monitor";
import { logSystemEvent } from "../monitoring/system-logger";
import { writeAuditLog } from "../monitoring/audit-logger";

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

export const getMonitoringDashboardDataFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getSession();
    if (!authData) throw new Error("Authentication required.");
    const { requireAdminAccess } = await import("../security/authz");
    await requireAdminAccess(authData.user.id);

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    const dayAgo = new Date(now.getTime() - 86400000);

    const [health, userCount, alertCount, errorCount, securityCount, unackedAlerts, securityEvents, recentLogs, recentAlerts, backupHistory, latestBackup, version] = await Promise.all([
      runHealthCheck(),
      db.select({ count: count() }).from(users).then(r => Number(r[0]?.count || 0)),
      db.select({ count: count() }).from(alertHistory).then(r => Number(r[0]?.count || 0)),
      getErrorCountSince(dayAgo),
      getSecurityEventCountSince(dayAgo),
      getUnacknowledgedAlerts().then(a => a.length),
      getUnresolvedSecurityEvents(),
      getRecentLogs(20),
      getRecentAlerts(10),
      getBackupHistory(10),
      getLatestBackup(),
      getVersionInfo(),
    ]);

    return {
      health,
      stats: { userCount, alertCount, errorCount, securityCount, unackedAlerts, timeRange: "24h" },
      securityEvents: securityEvents.slice(0, 10),
      logs: recentLogs,
      alerts: recentAlerts,
      backups: backupHistory,
      latestBackup,
      version,
    };
  });

export const triggerHealthCheckFn = createServerFn({ method: "POST" })
  .handler(async () => {
    await requireAdmin();
    return runHealthCheck();
  });

export const triggerBackupFn = createServerFn({ method: "POST" })
  .validator(z.object({ type: z.enum(["daily", "weekly", "monthly"]) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const success = await runBackup(data.type);
    await logSystemEvent({
      event_type: "admin_action",
      severity: success ? "info" : "error",
      description: `Manual ${data.type} backup triggered via admin panel`,
      metadata: { backup_type: data.type, success },
    });
    return { success };
  });

export const triggerRestoreFn = createServerFn({ method: "POST" })
  .validator(z.object({ backupId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const success = await restoreBackup(data.backupId);
    await logSystemEvent({
      event_type: "admin_action",
      severity: success ? "warn" : "error",
      description: `Database restore attempted from backup ${data.backupId.slice(0, 8)}`,
      metadata: { backup_id: data.backupId, success },
    });
    return { success };
  });

export const acknowledgeAlertFn = createServerFn({ method: "POST" })
  .validator(z.object({ alertId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await acknowledgeAlert(data.alertId);
    return { success: true };
  });

export const resolveSecurityEventFn = createServerFn({ method: "POST" })
  .validator(z.object({ eventId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await resolveSecurityEvent(data.eventId);
    await writeAuditLog({
      action: "admin.changed",
      entity_type: "user",
      entity_id: data.eventId,
      changes: { security_event: { old: "unresolved", new: "resolved" } },
    });
    return { success: true };
  });

export const sendTestAlertFn = createServerFn({ method: "POST" })
  .handler(async () => {
    await requireAdmin();
    await sendAlert({
      alert_type: "test",
      severity: "info",
      title: "Test Alert",
      description: "This is a test alert from the admin monitoring panel.",
      metadata: { test: true },
      channels: ["email"],
    });
    return { success: true };
  });
