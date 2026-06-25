import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import {
  analyticsEvents,
  emailNotifications,
  referralClicks,
  referralCodes,
  referralFraudAlerts,
  referralInvites,
  referralRewardMilestones,
  referralRewardsGranted,
  referrals,
  subscriptions,
  userBadges,
  userProfiles,
  users,
} from "../db/schema";
import { BADGE_DEFINITIONS, QUALIFIED_STATUSES, type BadgeKey } from "../referral/constants";

const generateId = () => crypto.randomUUID();

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

async function getSession() {
  const { getCurrentSession } = await import("../../server/auth/session.server");
  return getCurrentSession();
}

async function rateLimit(key: string, limit: number, windowMs: number) {
  const { checkRateLimit } = await import("../../server/auth/rate-limit.server");
  return checkRateLimit(key, limit, windowMs);
}

async function getClientIp() {
  try {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const forwarded = getRequestHeader("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
    return getRequestHeader("x-real-ip") || "unknown";
  } catch {
    return "unknown";
  }
}

async function getOrigin() {
  try {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const proto = getRequestHeader("x-forwarded-proto") || "http";
    const host = getRequestHeader("x-forwarded-host") || getRequestHeader("host") || "localhost:8080";
    return `${proto}://${host}`;
  } catch {
    return "http://localhost:8080";
  }
}

function generateReferralCodeValue() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  let suffix = "";
  for (let i = 0; i < 5; i++) suffix += CODE_CHARS[bytes[i]! % CODE_CHARS.length];
  return `AIRANK-${suffix}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isVpnSuspected(userAgent: string | null, ip: string) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  const vpnPatterns = ["vpn", "proxy", "tor", "anonymizer", "headless"];
  if (vpnPatterns.some((p) => ua.includes(p))) return true;
  if (ip === "unknown" || ip.startsWith("10.") || ip === "127.0.0.1") return false;
  return false;
}

async function isAdminUser(userId: string) {
  const { isAdmin } = await import("../security/authz");
  return isAdmin(userId);
}

async function queueReferralEmail(userId: string, type: string, subject: string, body: string) {
  const row = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row[0]) return;
  await db.insert(emailNotifications).values({
    id: generateId(),
    user_id: userId,
    email: row[0].email,
    type,
    subject,
    body,
  });
}

async function trackReferralEvent(eventName: string, userId: string | null, metadata: Record<string, unknown>) {
  await db.insert(analyticsEvents).values({
    id: generateId(),
    user_id: userId,
    event_name: eventName,
    page_url: "/referrals",
    session_id: "referral-system",
    metadata: JSON.stringify(metadata),
  });
}

async function createFraudAlert(
  alertType: string,
  severity: "low" | "medium" | "high",
  metadata: Record<string, unknown>,
  userId?: string | null,
  referralId?: string | null,
) {
  await db.insert(referralFraudAlerts).values({
    id: generateId(),
    user_id: userId || null,
    referral_id: referralId || null,
    alert_type: alertType,
    severity,
    metadata: JSON.stringify(metadata),
  });
}

export async function ensureUserReferralCode(userId: string) {
  const existing = await db.select().from(referralCodes).where(eq(referralCodes.user_id, userId)).limit(1);
  if (existing[0]) return existing[0].code;

  let code = generateReferralCodeValue();
  for (let attempt = 0; attempt < 10; attempt++) {
    const collision = await db.select().from(referralCodes).where(eq(referralCodes.code, code)).limit(1);
    if (!collision[0]) break;
    code = generateReferralCodeValue();
  }

  await db.insert(referralCodes).values({
    id: generateId(),
    user_id: userId,
    code,
  });
  return code;
}

async function getReferrerByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  const row = await db.select().from(referralCodes).where(eq(referralCodes.code, normalized)).limit(1);
  return row[0] || null;
}

async function countQualifiedReferrals(userId: string) {
  const rows = await db.select({ total: count() }).from(referrals)
    .where(and(
      eq(referrals.referrer_user_id, userId),
      inArray(referrals.status, [...QUALIFIED_STATUSES]),
    ));
  return rows[0]?.total ?? 0;
}

async function grantBadge(userId: string, badgeKey: BadgeKey) {
  const existing = await db.select().from(userBadges)
    .where(and(eq(userBadges.user_id, userId), eq(userBadges.badge_key, badgeKey)))
    .limit(1);
  if (existing[0]) return;
  await db.insert(userBadges).values({
    id: generateId(),
    user_id: userId,
    badge_key: badgeKey,
  });
}

async function extendProSubscription(userId: string, days: number) {
  const sub = await db.select().from(subscriptions).where(eq(subscriptions.user_id, userId)).limit(1);
  const now = new Date();
  const baseEnd = sub[0]?.current_period_end && sub[0].current_period_end > now
    ? sub[0].current_period_end
    : now;
  const newEnd = addDays(baseEnd, days);

  if (sub[0]) {
    await db.update(subscriptions).set({
      plan_name: sub[0].plan_name === "Free" ? "Pro" : sub[0].plan_name,
      status: "active",
      current_period_end: newEnd,
      updated_at: now,
    }).where(eq(subscriptions.id, sub[0].id));
  } else {
    await db.insert(subscriptions).values({
      id: generateId(),
      user_id: userId,
      stripe_customer_id: `referral_reward_${userId.slice(0, 8)}`,
      stripe_subscription_id: `referral_reward_sub_${generateId().slice(0, 8)}`,
      plan_name: "Pro",
      status: "active",
      billing_cycle: "monthly",
      current_period_start: now,
      current_period_end: newEnd,
    });
  }
}

async function evaluateAndGrantRewards(referrerUserId: string) {
  const qualifiedCount = await countQualifiedReferrals(referrerUserId);
  const milestones = await db.select().from(referralRewardMilestones)
    .where(eq(referralRewardMilestones.active, true))
    .orderBy(referralRewardMilestones.referral_count);

  const granted = await db.select().from(referralRewardsGranted)
    .where(eq(referralRewardsGranted.user_id, referrerUserId));
  const grantedMilestoneIds = new Set(granted.map((g) => g.milestone_id).filter(Boolean));

  const newRewards: string[] = [];

  for (const milestone of milestones) {
    if (qualifiedCount < milestone.referral_count) continue;
    if (grantedMilestoneIds.has(milestone.id)) continue;

    if (milestone.reward_type === "pro_extension_days") {
      await extendProSubscription(referrerUserId, milestone.reward_value);
      newRewards.push(milestone.label);
    } else if (milestone.reward_type === "badge") {
      await grantBadge(referrerUserId, "premium_badge");
      newRewards.push(milestone.label);
    } else if (milestone.reward_type === "exclusive_features") {
      await grantBadge(referrerUserId, "early_ambassador");
      newRewards.push(milestone.label);
    }

    await db.insert(referralRewardsGranted).values({
      id: generateId(),
      user_id: referrerUserId,
      milestone_id: milestone.id,
      reward_type: milestone.reward_type,
      reward_value: milestone.reward_value,
    });

    await queueReferralEmail(
      referrerUserId,
      "referral_reward_earned",
      `🎉 Reward unlocked: ${milestone.label}`,
      `Congratulations! You earned "${milestone.label}" for reaching ${milestone.referral_count} qualified referrals on AIRank.`,
    );
  }

  if (qualifiedCount >= 5) await grantBadge(referrerUserId, "growth_champion");
  if (qualifiedCount >= 10) await grantBadge(referrerUserId, "community_builder");

  if (newRewards.length > 0) {
    await trackReferralEvent("Referral Rewards Granted", referrerUserId, {
      rewards: newRewards,
      qualified_count: qualifiedCount,
    });
  }

  return { qualifiedCount, newRewards };
}

async function runFraudChecks(
  referrerUserId: string,
  referredUserId: string,
  ip: string,
  fingerprint?: string | null,
) {
  const issues: string[] = [];

  if (referrerUserId === referredUserId) {
    issues.push("self_referral");
    await createFraudAlert("self_referral", "high", { referrerUserId, referredUserId }, referrerUserId);
  }

  const referrerSessions = await db.select().from(referrals)
    .where(and(eq(referrals.referrer_user_id, referrerUserId), eq(referrals.ip_address, ip)))
    .limit(5);
  if (referrerSessions.length >= 3) {
    issues.push("duplicate_ip");
    await createFraudAlert("duplicate_ip", "medium", { ip, count: referrerSessions.length }, referrerUserId);
  }

  const recentSameIp = await db.select({ total: count() }).from(referrals)
    .where(and(
      eq(referrals.ip_address, ip),
      gte(referrals.created_at, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    ));
  if ((recentSameIp[0]?.total ?? 0) >= 5) {
    issues.push("reward_farming");
    await createFraudAlert("reward_farming", "high", { ip, count: recentSameIp[0]?.total }, referrerUserId);
  }

  if (fingerprint) {
    const dupFingerprint = await db.select().from(referrals)
      .where(and(eq(referrals.fingerprint, fingerprint), eq(referrals.referrer_user_id, referrerUserId)))
      .limit(1);
    if (dupFingerprint[0]) {
      issues.push("duplicate_account");
      await createFraudAlert("duplicate_account", "high", { fingerprint }, referrerUserId);
    }
  }

  const referrer = await db.select().from(users).where(eq(users.id, referrerUserId)).limit(1);
  const referred = await db.select().from(users).where(eq(users.id, referredUserId)).limit(1);
  if (referrer[0] && referred[0] && referrer[0].email.split("@")[1] === referred[0].email.split("@")[1]) {
    const domainSignups = await db.select({ total: count() }).from(referrals)
      .innerJoin(users, eq(referrals.referred_user_id, users.id))
      .where(and(
        eq(referrals.referrer_user_id, referrerUserId),
        sql`substr(${users.email}, instr(${users.email}, '@') + 1) = ${referrer[0].email.split("@")[1]}`,
      ));
    if ((domainSignups[0]?.total ?? 0) >= 3) {
      issues.push("suspicious_domain");
      await createFraudAlert("suspicious_domain", "medium", { domain: referrer[0].email.split("@")[1] }, referrerUserId);
    }
  }

  return issues;
}

export async function processReferralSignup(
  referralCode: string,
  referredUserId: string,
  ip?: string,
  fingerprint?: string | null,
) {
  const referrer = await getReferrerByCode(referralCode);
  if (!referrer) return { success: false, reason: "invalid_code" };

  if (referrer.user_id === referredUserId) {
    await createFraudAlert("self_referral", "high", { referralCode }, referrer.user_id);
    return { success: false, reason: "self_referral" };
  }

  const existingReferral = await db.select().from(referrals)
    .where(eq(referrals.referred_user_id, referredUserId))
    .limit(1);
  if (existingReferral[0]) {
    return { success: false, reason: "already_referred" };
  }

  const clientIp = ip || await getClientIp();
  const fraudIssues = await runFraudChecks(referrer.user_id, referredUserId, clientIp, fingerprint);
  const status = fraudIssues.length > 0 ? "fraud" : "signed_up";

  const referralId = generateId();
  await db.insert(referrals).values({
    id: referralId,
    referrer_user_id: referrer.user_id,
    referred_user_id: referredUserId,
    referral_code: referrer.code,
    status,
    ip_address: clientIp,
    fingerprint: fingerprint || null,
  });

  await db.update(referralClicks)
    .set({ converted: true })
    .where(and(
      eq(referralClicks.referral_code, referrer.code),
      eq(referralClicks.ip_address, clientIp),
    ));

  await trackReferralEvent("Referral Signup", referredUserId, {
    referral_code: referrer.code,
    referrer_user_id: referrer.user_id,
    status,
  });

  if (status !== "fraud") {
    await queueReferralEmail(
      referrer.user_id,
      "referral_signup",
      "Someone signed up with your referral link!",
      `Great news! A new user joined AIRank using your referral code ${referrer.code}. They'll count toward your rewards once they complete onboarding.`,
    );
  }

  return { success: true, referralId, status };
}

export async function qualifyReferral(referredUserId: string) {
  const row = await db.select().from(referrals)
    .where(and(eq(referrals.referred_user_id, referredUserId), eq(referrals.status, "signed_up")))
    .limit(1);
  if (!row[0]) return { success: false };

  await db.update(referrals).set({
    status: "qualified",
    qualified_at: new Date(),
  }).where(eq(referrals.id, row[0].id));

  await trackReferralEvent("Referral Qualified", row[0].referrer_user_id, {
    referral_id: row[0].id,
    referred_user_id: referredUserId,
  });

  const rewardResult = await evaluateAndGrantRewards(row[0].referrer_user_id);

  const qualifiedCount = rewardResult.qualifiedCount;
  const milestoneThresholds = [1, 3, 5, 10, 20];
  if (milestoneThresholds.includes(qualifiedCount)) {
    await queueReferralEmail(
      row[0].referrer_user_id,
      "referral_milestone",
      `Milestone reached: ${qualifiedCount} qualified referrals!`,
      `You've reached ${qualifiedCount} qualified referrals on AIRank. Keep sharing to unlock more rewards!`,
    );
  }

  return { success: true, referrerUserId: row[0].referrer_user_id };
}

export async function convertReferral(referredUserId: string, revenueCents = 0) {
  const row = await db.select().from(referrals)
    .where(and(
      eq(referrals.referred_user_id, referredUserId),
      inArray(referrals.status, ["signed_up", "qualified"]),
    ))
    .limit(1);
  if (!row[0]) return { success: false };

  const wasQualified = row[0].status === "qualified";

  await db.update(referrals).set({
    status: "converted",
    converted_at: new Date(),
    revenue_cents: row[0].revenue_cents + revenueCents,
    reward_granted: true,
    ...(wasQualified ? {} : { qualified_at: new Date() }),
  }).where(eq(referrals.id, row[0].id));

  if (!wasQualified) {
    await evaluateAndGrantRewards(row[0].referrer_user_id);
  }

  await trackReferralEvent("Referral Conversion", row[0].referrer_user_id, {
    referral_id: row[0].id,
    referred_user_id: referredUserId,
    revenue_cents: revenueCents,
  });

  await queueReferralEmail(
    row[0].referrer_user_id,
    "referral_conversion",
    "Your referral converted to a paid plan!",
    `One of your referrals just upgraded to a paid AIRank plan. Revenue attributed: $${(revenueCents / 100).toFixed(2)}.`,
  );

  return { success: true, referrerUserId: row[0].referrer_user_id };
}

export const trackReferralClickFn = createServerFn({ method: "POST" })
  .validator(z.object({
    code: z.string().min(5),
    sessionId: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const ip = await getClientIp();
    if (!await rateLimit(`ref-click:${ip}`, 30, 60_000)) {
      throw new Error("Too many requests.");
    }

    const referrer = await getReferrerByCode(data.code);
    if (!referrer) throw new Error("Invalid referral code.");

    const userAgent = getRequestHeader("user-agent") || "";
    const vpnSuspected = isVpnSuspected(userAgent, ip);

    await db.insert(referralClicks).values({
      id: generateId(),
      referral_code: referrer.code,
      referrer_user_id: referrer.user_id,
      ip_address: ip,
      user_agent: userAgent,
      session_id: data.sessionId || null,
      is_vpn_suspected: vpnSuspected,
    });

    if (vpnSuspected) {
      await createFraudAlert("vpn_abuse", "low", { ip, userAgent: userAgent.slice(0, 200) }, referrer.user_id);
    }

    await trackReferralEvent("Referral Click", null, {
      referral_code: referrer.code,
      referrer_user_id: referrer.user_id,
      ip,
      vpn_suspected: vpnSuspected,
    });

    return { success: true, code: referrer.code };
  });

export const getReferralDashboardFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getSession();
    if (!authData) throw new Error("Please log in.");

    const userId = authData.user.id;
    const code = await ensureUserReferralCode(userId);
    const origin = await getOrigin();
    const link = `${origin}/ref/${code}`;

    const allReferrals = await db.select().from(referrals)
      .where(eq(referrals.referrer_user_id, userId))
      .orderBy(desc(referrals.created_at));

    const clicks = await db.select({ total: count() }).from(referralClicks)
      .where(eq(referralClicks.referral_code, code));

    const invites = await db.select({ total: count() }).from(referralInvites)
      .where(eq(referralInvites.referrer_user_id, userId));

    const successful = allReferrals.filter((r) => QUALIFIED_STATUSES.includes(r.status as typeof QUALIFIED_STATUSES[number])).length;
    const signups = allReferrals.filter((r) => r.status !== "pending" && r.status !== "fraud").length;
    const conversions = allReferrals.filter((r) => r.status === "converted").length;
    const totalClicks = clicks[0]?.total ?? 0;
    const conversionRate = totalClicks > 0 ? Math.round((signups / totalClicks) * 100) : 0;

    const rewardsGranted = await db.select().from(referralRewardsGranted)
      .where(eq(referralRewardsGranted.user_id, userId))
      .orderBy(desc(referralRewardsGranted.granted_at));

    const milestones = await db.select().from(referralRewardMilestones)
      .where(eq(referralRewardMilestones.active, true))
      .orderBy(referralRewardMilestones.referral_count);

    const badges = await db.select().from(userBadges).where(eq(userBadges.user_id, userId));

    const referredUsers = await Promise.all(
      allReferrals.slice(0, 20).map(async (ref) => {
        if (!ref.referred_user_id) return { ...ref, referred_name: "Pending" };
        const profile = await db.select().from(userProfiles).where(eq(userProfiles.user_id, ref.referred_user_id)).limit(1);
        const user = await db.select().from(users).where(eq(users.id, ref.referred_user_id)).limit(1);
        return {
          ...ref,
          referred_name: profile[0]?.username || user[0]?.name || "User",
        };
      }),
    );

    return {
      code,
      link,
      stats: {
        invites_sent: invites[0]?.total ?? 0,
        link_clicks: totalClicks,
        signups,
        successful_referrals: successful,
        conversions,
        conversion_rate: conversionRate,
        rewards_earned: rewardsGranted.length,
        revenue_cents: allReferrals.reduce((sum, r) => sum + r.revenue_cents, 0),
      },
      milestones,
      rewardsGranted,
      badges: badges.map((b) => ({
        ...b,
        ...BADGE_DEFINITIONS[b.badge_key as BadgeKey],
      })),
      referrals: referredUsers,
      qualified_count: await countQualifiedReferrals(userId),
    };
  });

export const sendReferralInviteFn = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Please log in.");

    const ip = await getClientIp();
    if (!await rateLimit(`ref-invite:${authData.user.id}`, 10, 60 * 60 * 1000)) {
      throw new Error("Invite limit reached. Try again later.");
    }

    const code = await ensureUserReferralCode(authData.user.id);
    const origin = await getOrigin();
    const link = `${origin}/ref/${code}`;

    const existingUser = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existingUser[0]) throw new Error("This email already has an AIRank account.");

    const priorInvite = await db.select().from(referralInvites)
      .where(and(eq(referralInvites.referrer_user_id, authData.user.id), eq(referralInvites.email, data.email)))
      .limit(1);
    if (priorInvite[0]) throw new Error("You already invited this email.");

    await db.insert(referralInvites).values({
      id: generateId(),
      referrer_user_id: authData.user.id,
      email: data.email,
      status: "sent",
    });

    await db.insert(emailNotifications).values({
      id: generateId(),
      user_id: null,
      email: data.email,
      type: "referral_invite",
      subject: `${authData.user.name} invited you to AIRank`,
      body: `${authData.user.name} thinks you'd love AIRank — the AI tool discovery platform.\n\nJoin with their referral link: ${link}\n\nCode: ${code}`,
    });

    await trackReferralEvent("Referral Invite Sent", authData.user.id, { email: data.email, code });

    return { success: true };
  });

export const getLeaderboardFn = createServerFn({ method: "GET" })
  .validator(z.object({ period: z.enum(["monthly", "all_time"]).default("all_time") }))
  .handler(async ({ data }) => {
    const since = data.period === "monthly"
      ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      : new Date(0);

    const rows = await db.select({
      referrer_user_id: referrals.referrer_user_id,
      qualified: count(referrals.id),
      conversions: sql<number>`sum(case when ${referrals.status} = 'converted' then 1 else 0 end)`,
      revenue: sql<number>`sum(${referrals.revenue_cents})`,
    }).from(referrals)
      .where(and(
        inArray(referrals.status, [...QUALIFIED_STATUSES, "signed_up", "converted"]),
        gte(referrals.created_at, since),
      ))
      .groupBy(referrals.referrer_user_id)
      .orderBy(desc(count(referrals.id)))
      .limit(50);

    const leaders = await Promise.all(rows.map(async (row, index) => {
      const profile = await db.select().from(userProfiles)
        .where(eq(userProfiles.user_id, row.referrer_user_id))
        .limit(1);
      const user = await db.select().from(users)
        .where(eq(users.id, row.referrer_user_id))
        .limit(1);
      const code = await db.select().from(referralCodes)
        .where(eq(referralCodes.user_id, row.referrer_user_id))
        .limit(1);
      return {
        rank: index + 1,
        user_id: row.referrer_user_id,
        name: profile[0]?.username || user[0]?.name || "Anonymous",
        avatar: user[0]?.avatar || profile[0]?.avatar_url,
        referral_code: code[0]?.code || "",
        qualified_referrals: row.qualified,
        conversions: Number(row.conversions) || 0,
        revenue_cents: Number(row.revenue) || 0,
      };
    }));

    const authData = await getSession();
    let myRank: number | null = null;
    if (authData) {
      const idx = leaders.findIndex((l) => l.user_id === authData.user.id);
      myRank = idx >= 0 ? idx + 1 : null;
      if (leaders.some((l) => l.rank <= 10 && l.user_id === authData.user.id)) {
        await grantBadge(authData.user.id, "top_referrer");
      }
    }

    return { leaders, period: data.period, my_rank: myRank };
  });

export const getReferralAnalyticsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getSession();
    if (!authData || !(await isAdminUser(authData.user.id))) {
      throw new Error("Admin access required.");
    }

    const totalClicks = await db.select({ total: count() }).from(referralClicks);
    const totalSignups = await db.select({ total: count() }).from(referrals)
      .where(inArray(referrals.status, ["signed_up", "qualified", "converted"]));
    const totalConversions = await db.select({ total: count() }).from(referrals)
      .where(eq(referrals.status, "converted"));
    const totalRevenue = await db.select({
      total: sql<number>`coalesce(sum(${referrals.revenue_cents}), 0)`,
    }).from(referrals);

    const topReferrers = await db.select({
      referrer_user_id: referrals.referrer_user_id,
      count: count(referrals.id),
      revenue: sql<number>`sum(${referrals.revenue_cents})`,
    }).from(referrals)
      .where(inArray(referrals.status, [...QUALIFIED_STATUSES, "converted"]))
      .groupBy(referrals.referrer_user_id)
      .orderBy(desc(count(referrals.id)))
      .limit(10);

    const topWithNames = await Promise.all(topReferrers.map(async (r) => {
      const user = await db.select().from(users).where(eq(users.id, r.referrer_user_id)).limit(1);
      const profile = await db.select().from(userProfiles).where(eq(userProfiles.user_id, r.referrer_user_id)).limit(1);
      return {
        user_id: r.referrer_user_id,
        name: profile[0]?.username || user[0]?.name || "Unknown",
        referrals: r.count,
        revenue_cents: Number(r.revenue) || 0,
      };
    }));

    const fraudAlerts = await db.select().from(referralFraudAlerts)
      .where(eq(referralFraudAlerts.resolved, false))
      .orderBy(desc(referralFraudAlerts.created_at))
      .limit(20);

    const rewardsDistribution = await db.select({
      reward_type: referralRewardsGranted.reward_type,
      count: count(referralRewardsGranted.id),
    }).from(referralRewardsGranted)
      .groupBy(referralRewardsGranted.reward_type);

    const alertsWithUsers = await Promise.all(fraudAlerts.map(async (alert) => {
      const user = alert.user_id
        ? await db.select().from(users).where(eq(users.id, alert.user_id)).limit(1)
        : [];
      return {
        ...alert,
        user_name: user[0]?.name || "Unknown",
        metadata: JSON.parse(alert.metadata),
      };
    }));

    return {
      clicks: totalClicks[0]?.total ?? 0,
      signups: totalSignups[0]?.total ?? 0,
      conversions: totalConversions[0]?.total ?? 0,
      revenue_cents: Number(totalRevenue[0]?.total) || 0,
      top_referrers: topWithNames,
      fraud_alerts: alertsWithUsers,
      rewards_distribution: rewardsDistribution,
      conversion_rate: (totalClicks[0]?.total ?? 0) > 0
        ? Math.round(((totalSignups[0]?.total ?? 0) / (totalClicks[0]?.total ?? 1)) * 100)
        : 0,
    };
  });

export const resolveFraudAlertFn = createServerFn({ method: "POST" })
  .validator(z.object({ alertId: z.string() }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData || !(await isAdminUser(authData.user.id))) {
      throw new Error("Admin access required.");
    }

    await db.update(referralFraudAlerts).set({ resolved: true })
      .where(eq(referralFraudAlerts.id, data.alertId));

    return { success: true };
  });

export const getReferralLandingFn = createServerFn({ method: "GET" })
  .validator(z.object({ code: z.string() }))
  .handler(async ({ data }) => {
    const referrer = await getReferrerByCode(data.code);
    if (!referrer) return { valid: false as const };

    const profile = await db.select().from(userProfiles).where(eq(userProfiles.user_id, referrer.user_id)).limit(1);
    const user = await db.select().from(users).where(eq(users.id, referrer.user_id)).limit(1);

    const qualifiedCount = await countQualifiedReferrals(referrer.user_id);

    return {
      valid: true as const,
      code: referrer.code,
      referrer_name: profile[0]?.full_name || user[0]?.name || "An AIRank member",
      referrer_avatar: user[0]?.avatar || profile[0]?.avatar_url,
      qualified_referrals: qualifiedCount,
    };
  });

export const sendLeaderboardDigestFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const authData = await getSession();
    if (!authData || !(await isAdminUser(authData.user.id))) {
      throw new Error("Admin access required.");
    }

    const since = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const rows = await db.select({
      referrer_user_id: referrals.referrer_user_id,
      qualified: count(referrals.id),
    }).from(referrals)
      .where(and(
        inArray(referrals.status, [...QUALIFIED_STATUSES, "signed_up", "converted"]),
        gte(referrals.created_at, since),
      ))
      .groupBy(referrals.referrer_user_id)
      .orderBy(desc(count(referrals.id)))
      .limit(5);

    let notified = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      await queueReferralEmail(
        row.referrer_user_id,
        "leaderboard_update",
        "You're on the AIRank referral leaderboard!",
        `Great work! You're ranked #${i + 1} this month with ${row.qualified} qualified referrals.`,
      );
      notified++;
    }

    return { success: true, notified };
  });
