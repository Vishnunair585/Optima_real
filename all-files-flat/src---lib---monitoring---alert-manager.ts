import { db } from "../db";
import { alertHistory } from "../db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../email/send-email";
import { captureBackendError } from "./sentry.server";

const generateId = () => crypto.randomUUID();

interface AlertInput {
  alert_type: string;
  severity?: "info" | "warn" | "critical";
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}

export async function sendAlert(input: AlertInput) {
  const channels = input.channels || ["email"];

  // Log to alert_history
  const alertId = generateId();
  await db.insert(alertHistory).values({
    id: alertId,
    alert_type: input.alert_type,
    severity: input.severity || "warn",
    title: input.title,
    description: input.description,
    metadata: JSON.stringify(input.metadata || {}),
    channels: JSON.stringify(channels),
    delivered: false,
  });

  const adminEmail = process.env.ALERT_EMAIL || "admin@optima.app";

  for (const channel of channels) {
    try {
      if (channel === "email") {
        await deliverEmailAlert(adminEmail, input);
      } else if (channel === "slack") {
        await deliverSlackAlert(input);
      } else if (channel === "discord") {
        await deliverDiscordAlert(input);
      }
    } catch (err) {
      console.error(`[alert-manager] Failed to send via ${channel}:`, err);
      captureBackendError(err as Error, { context: "alert-manager", channel, alert: input.alert_type });
    }
  }

  // Mark delivered
  await db.update(alertHistory).set({ delivered: true }).where(eq(alertHistory.id, alertId));
}

async function deliverEmailAlert(to: string, alert: AlertInput) {
  await sendEmail(
    to,
    `[${alert.severity?.toUpperCase()}] ${alert.title}`,
    `Alert: ${alert.title}\n\n${alert.description}\n\nType: ${alert.alert_type}\nSeverity: ${alert.severity}\nTime: ${new Date().toISOString()}`
  );
}

async function deliverSlackAlert(alert: AlertInput) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log(`[alert-manager][slack] Would send: ${alert.title} — ${alert.description}`);
    return;
  }
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `*[${alert.severity?.toUpperCase()}] ${alert.title}*\n${alert.description}\n_Type: ${alert.alert_type}_`,
    }),
  });
}

async function deliverDiscordAlert(alert: AlertInput) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log(`[alert-manager][discord] Would send: ${alert.title} — ${alert.description}`);
    return;
  }
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `**[${alert.severity?.toUpperCase()}] ${alert.title}**\n${alert.description}\n_Type: ${alert.alert_type}_`,
    }),
  });
}

export async function getRecentAlerts(limit = 50) {
  const { desc } = await import("drizzle-orm");
  return db.select().from(alertHistory).orderBy(desc(alertHistory.created_at)).limit(limit);
}

export async function acknowledgeAlert(alertId: string) {
  await db.update(alertHistory).set({ acknowledged_at: new Date() }).where(eq(alertHistory.id, alertId));
}

export async function getUnacknowledgedAlerts() {
  const { eq, desc, isNull } = await import("drizzle-orm");
  return db.select().from(alertHistory).where(isNull(alertHistory.acknowledged_at)).orderBy(desc(alertHistory.created_at)).limit(20);
}
