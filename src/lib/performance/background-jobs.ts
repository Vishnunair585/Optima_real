import { registerJob, enqueue, initializeQueue } from "../queue";
import { getDb } from "../db/connection";
import { analyticsEvents, emailNotifications, systemLogs } from "../db/schema";
import { eq } from "drizzle-orm";
import { getTableStats } from "../db/perf";
import { getRecentVitals } from "../monitoring/perf-monitor";

export function initializeBackgroundJobs(): void {
  initializeQueue();

  registerJob("process_email", {
    handler: async (payload: unknown) => {
      const { id } = payload as { id: string };
      const { sendEmail } = await import("../email/send-email");
      const db = getDb();

      const [notification] = await db.select()
        .from(emailNotifications)
        .where(eq(emailNotifications.id, id))
        .limit(1);

      if (!notification || notification.status !== "queued") return;

      try {
        await sendEmail(notification.email, notification.subject, notification.body);
        await db.update(emailNotifications)
          .set({ status: "sent", sent_at: new Date() })
          .where(eq(emailNotifications.id, id));
      } catch (err) {
        await db.update(emailNotifications)
          .set({ status: "failed" })
          .where(eq(emailNotifications.id, id));
        throw err;
      }
    },
    retries: 3,
    retryDelayMs: 5000,
  });

  registerJob("daily_analytics_snapshot", {
    handler: async () => {
      const db = getDb();
      const stats = getTableStats();
      const vitals = getRecentVitals(10);
      const snapshot = {
        timestamp: new Date().toISOString(),
        tables: stats,
        performance: vitals,
      };
      await db.insert(systemLogs).values({
        id: crypto.randomUUID(),
        event_type: "analytics_snapshot",
        severity: "info",
        description: "Daily analytics snapshot generated",
        metadata: JSON.stringify(snapshot),
        ip_address: "system",
        user_agent: "background-job",
      });
    },
    retries: 2,
  });

  registerJob("cleanup_expired_tokens", {
    handler: async () => {
      const db = getDb();
      const now = new Date();
      const { passwordResetTokens, emailVerificationTokens } = await import("../db/schema");
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.expires_at, null as any));
      await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.expires_at, null as any));
    },
    retries: 1,
  });

  registerJob("referral_reward_evaluation", {
    handler: async (payload: unknown) => {
      const { userId } = payload as { userId: string };
      const { qualifyReferral } = await import("../api/referral.functions");
      await qualifyReferral(userId);
    },
    retries: 2,
  });

  registerJob("process_analytics_batch", {
    handler: async (payload: unknown) => {
      const { events } = payload as { events: { userId: string; event: string; url: string }[] };
      const db = getDb();
      for (const event of events) {
        await db.insert(analyticsEvents).values({
          id: crypto.randomUUID(),
          user_id: event.userId,
          event_name: event.event,
          page_url: event.url,
          session_id: "batch",
          metadata: "{}",
        });
      }
    },
    retries: 2,
  });

  registerJob("prune_old_data", {
    handler: async () => {
      const db = getDb();
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      await db.delete(analyticsEvents)
        .where(eq(analyticsEvents.created_at, null as any));

      await db.delete(systemLogs)
        .where(eq(systemLogs.created_at, null as any));
    },
    retries: 1,
  });

  registerJob("report_generation", {
    handler: async (payload: unknown) => {
      const { type, userId } = payload as { type: string; userId?: string };
      if (type === "weekly_summary") {
        const { getPerformanceHistory } = await import("../performance/observer");
        const history = getPerformanceHistory(10080);
        await db.insert(systemLogs).values({
          id: crypto.randomUUID(),
          event_type: "report_generated",
          severity: "info",
          description: `Weekly performance report generated`,
          metadata: JSON.stringify({ type, data_points: history.length }),
          ip_address: "system",
          user_agent: "background-job",
        });
      }
    },
    retries: 1,
  });
}

export async function enqueueEmail(userId: string, email: string, subject: string, body: string): Promise<string> {
  const db = getDb();
  const notification = await db.insert(emailNotifications).values({
    id: crypto.randomUUID(),
    user_id: userId,
    email,
    type: "transactional",
    subject,
    body,
  }).returning({ id: emailNotifications.id });

  const id = notification[0]?.id;
  if (id) {
    await enqueue("process_email", { id });
  }
  return id || "";
}

export async function enqueueAnalyticsBatch(events: { userId: string; event: string; url: string }[]): Promise<void> {
  await enqueue("process_analytics_batch", { events }, { priority: 1 });
}

export async function enqueueReferralReward(userId: string): Promise<void> {
  await enqueue("referral_reward_evaluation", { userId });
}

export async function scheduleDailyJobs(): Promise<void> {
  await enqueue("daily_analytics_snapshot", {});
  await enqueue("cleanup_expired_tokens", {});
  await enqueue("prune_old_data", {});
}
