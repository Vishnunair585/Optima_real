import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import {
  analyticsEvents,
  billingEvents,
  coupons,
  emailNotifications,
  paymentHistory,
  subscriptions,
  teamMembers,
  teamWorkspaces,
  usageEvents,
  userUsage,
} from "../db/schema";

const generateId = () => crypto.randomUUID();

async function getSession() {
  const { getCurrentSession } = await import("../../server/auth/session.server");
  return getCurrentSession();
}

type PlanName = "Free" | "Pro" | "Team";
type BillingCycle = "monthly" | "yearly";
type UsageFeature = "comparison" | "stack" | "saved_tool" | "premium_feature";

export const PLANS = {
  FREE: {
    name: "Free" as const,
    monthly_price: 0,
    yearly_price: 0,
    comparisons_limit: 5,
    stacks_limit: 5,
    saved_tools_limit: 25,
    premium_feature_limit: 10,
    features: ["5 Tool Comparisons per Month", "5 Saved Stacks", "10 AI Recommendations per Month", "Basic Reviews Access", "Basic Analytics"],
  },
  PRO: {
    name: "Pro" as const,
    monthly_price: 20,
    yearly_price: 180,
    comparisons_limit: null,
    stacks_limit: null,
    saved_tools_limit: null,
    premium_feature_limit: null,
    features: ["Unlimited Comparisons", "Unlimited Saved Stacks", "AI Recommendations", "Premium Insights", "Advanced Analytics", "Priority Features"],
  },
  TEAM: {
    name: "Team" as const,
    monthly_price: 49,
    yearly_price: 440,
    comparisons_limit: null,
    stacks_limit: null,
    saved_tools_limit: null,
    premium_feature_limit: null,
    features: ["Everything in PRO", "Team Workspaces", "Shared Collections", "Team Analytics", "Role Management", "Collaboration Features"],
  },
};

const planSchema = z.enum(["Pro", "Team"]);
const cycleSchema = z.enum(["monthly", "yearly"]);

function getOrigin() {
  const proto = getRequestHeader("x-forwarded-proto") || "http";
  const host = getRequestHeader("x-forwarded-host") || getRequestHeader("host") || "localhost:5173";
  return `${proto}://${host}`;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function activeStatuses() {
  return ["active", "trialing", "past_due"];
}

function normalizePlan(plan: string | null | undefined): PlanName {
  if (plan === "Team") return "Team";
  if (plan === "Pro") return "Pro";
  return "Free";
}

function priceEnvName(planName: "Pro" | "Team", cycle: BillingCycle) {
  return `STRIPE_PRICE_${planName.toUpperCase()}_${cycle.toUpperCase()}`;
}

function getStripePriceId(planName: "Pro" | "Team", cycle: BillingCycle) {
  const configured = process.env[priceEnvName(planName, cycle)];
  if (configured) return configured;
  const price = planName === "Team"
    ? (cycle === "yearly" ? PLANS.TEAM.yearly_price : PLANS.TEAM.monthly_price)
    : (cycle === "yearly" ? PLANS.PRO.yearly_price : PLANS.PRO.monthly_price);
  return `local_${planName.toLowerCase()}_${cycle}_${price}`;
}

function getTrialDays(planName: "Pro" | "Team") {
  const configured = Number(process.env[`TRIAL_DAYS_${planName.toUpperCase()}`] || process.env.TRIAL_DAYS || "");
  if (Number.isFinite(configured) && configured >= 0) return configured;
  return planName === "Team" ? 14 : 7;
}

function planLimits(planName: PlanName) {
  if (planName === "Team") return PLANS.TEAM;
  if (planName === "Pro") return PLANS.PRO;
  return PLANS.FREE;
}

async function stripeRequest<T>(path: string, body: URLSearchParams) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe secret key is not configured.");

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Stripe request failed.");
  }
  return payload as T;
}

async function queueBillingEmail(userId: string | null, email: string, type: string, subject: string, body: string) {
  await db.insert(emailNotifications).values({
    id: generateId(),
    user_id: userId,
    email,
    type,
    subject,
    body,
  });
}

async function trackBillingEvent(eventName: string, metadata: Record<string, unknown>, userId?: string | null, stripeEventId?: string | null) {
  await db.insert(billingEvents).values({
    id: generateId(),
    user_id: userId || null,
    event_name: eventName,
    stripe_event_id: stripeEventId || null,
    metadata: JSON.stringify(metadata),
  }).onConflictDoNothing();
}

async function getOrCreateUsage(userId: string) {
  const now = new Date();
  const existing = await db.select().from(userUsage).where(eq(userUsage.user_id, userId)).limit(1);
  const current = existing[0];

  if (current && current.reset_at > now) return current;

  const reset = addMonths(now, 1);
  if (current) {
    await db.update(userUsage).set({
      period_start: now,
      period_end: reset,
      reset_at: reset,
      comparisons_count: 0,
      stacks_count: 0,
      saved_tools_count: 0,
      premium_feature_count: 0,
      updated_at: now,
    }).where(eq(userUsage.id, current.id));
    return {
      ...current,
      period_start: now,
      period_end: reset,
      reset_at: reset,
      comparisons_count: 0,
      stacks_count: 0,
      saved_tools_count: 0,
      premium_feature_count: 0,
      updated_at: now,
    };
  }

  const created = {
    id: generateId(),
    user_id: userId,
    period_start: now,
    period_end: reset,
    comparisons_count: 0,
    stacks_count: 0,
    saved_tools_count: 0,
    premium_feature_count: 0,
    reset_at: reset,
    updated_at: now,
  };
  await db.insert(userUsage).values(created);
  return created;
}

async function getActiveSubscription(userId: string) {
  const rows = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.user_id, userId), inArray(subscriptions.status, activeStatuses())))
    .orderBy(desc(subscriptions.updated_at))
    .limit(1);
  return rows[0] || null;
}

export async function canUseFeature(userId: string, feature: UsageFeature) {
  const activeSub = await getActiveSubscription(userId);
  const planName = normalizePlan(activeSub?.plan_name);
  const usage = await getOrCreateUsage(userId);
  const limits = planLimits(planName);

  const currentByFeature = {
    comparison: usage.comparisons_count,
    stack: usage.stacks_count,
    saved_tool: usage.saved_tools_count,
    premium_feature: usage.premium_feature_count,
  };
  const limitByFeature = {
    comparison: limits.comparisons_limit,
    stack: limits.stacks_limit,
    saved_tool: limits.saved_tools_limit,
    premium_feature: limits.premium_feature_limit,
  };

  const current = currentByFeature[feature];
  const limit = limitByFeature[feature];
  const allowed = limit === null || current < limit;

  return {
    allowed,
    plan: planName,
    current,
    limit,
    reset_at: usage.reset_at,
    reason: allowed ? null : `${planName} plan limit reached for ${feature.replace("_", " ")}.`,
  };
}

export async function recordFeatureUsage(userId: string, feature: UsageFeature, metadata: Record<string, unknown> = {}) {
  const gate = await canUseFeature(userId, feature);
  if (!gate.allowed) return gate;

  const usage = await getOrCreateUsage(userId);
  const nextValues = {
    comparison: { comparisons_count: usage.comparisons_count + 1 },
    stack: { stacks_count: usage.stacks_count + 1 },
    saved_tool: { saved_tools_count: usage.saved_tools_count + 1 },
    premium_feature: { premium_feature_count: usage.premium_feature_count + 1 },
  }[feature];

  await db.update(userUsage).set({ ...nextValues, updated_at: new Date() }).where(eq(userUsage.id, usage.id));
  await db.insert(usageEvents).values({
    id: generateId(),
    user_id: userId,
    feature,
    quantity: 1,
    plan_name: gate.plan,
    metadata: JSON.stringify(metadata),
  });

  return { ...gate, current: gate.current + 1 };
}

export const getSubscriptionStatusFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getSession();
    if (!authData) {
      return {
        plan: PLANS.FREE.name,
        status: "active",
        billing_cycle: "monthly",
        usage: { comparisons: 0, stacks: 0, saved_tools: 0, premium_features: 0 },
        limits: PLANS.FREE,
        team: null,
      };
    }

    const activeSub = await getActiveSubscription(authData.user.id);
    const usage = await getOrCreateUsage(authData.user.id);
    const plan = normalizePlan(activeSub?.plan_name);
    const workspace = await db.select().from(teamWorkspaces)
      .where(eq(teamWorkspaces.owner_user_id, authData.user.id))
      .limit(1);
    const members = workspace[0]
      ? await db.select().from(teamMembers).where(eq(teamMembers.workspace_id, workspace[0].id))
      : [];

    return {
      plan,
      status: activeSub?.status || "active",
      billing_cycle: activeSub?.billing_cycle || "monthly",
      current_period_start: activeSub?.current_period_start || null,
      current_period_end: activeSub?.current_period_end || null,
      stripe_customer_id: activeSub?.stripe_customer_id || null,
      stripe_subscription_id: activeSub?.stripe_subscription_id || null,
      usage: {
        comparisons: usage.comparisons_count,
        stacks: usage.stacks_count,
        saved_tools: usage.saved_tools_count,
        premium_features: usage.premium_feature_count,
        reset_at: usage.reset_at,
      },
      limits: planLimits(plan),
      team: workspace[0]
        ? {
          ...workspace[0],
          activeSeats: members.filter((member) => member.status !== "removed").length,
          members,
        }
        : null,
    };
  });

export const checkUsageLimitFn = createServerFn({ method: "POST" })
  .validator(z.object({
    type: z.enum(["comparison", "stack", "saved_tool", "premium_feature"]),
  }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Please sign in.");
    return recordFeatureUsage(authData.user.id, data.type);
  });

export const createCheckoutSessionFn = createServerFn({ method: "POST" })
  .validator(z.object({
    planName: planSchema,
    cycle: cycleSchema,
    couponCode: z.string().trim().optional(),
    seats: z.number().int().min(1).max(100).optional(),
  }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Please log in to upgrade.");

    const origin = getOrigin();
    const trialDays = getTrialDays(data.planName);
    const priceId = getStripePriceId(data.planName, data.cycle);
    await trackBillingEvent("checkout_started", {
      plan: data.planName,
      cycle: data.cycle,
      priceId,
      seats: data.seats || 1,
    }, authData.user.id);

    if (!process.env.STRIPE_SECRET_KEY || priceId.startsWith("local_")) {
      const successUrl = `${origin}/billing?success=true&plan=${data.planName}&cycle=${data.cycle}`;
      return { url: successUrl, mode: "local" };
    }

    const body = new URLSearchParams();
    body.set("mode", "subscription");
    body.set("success_url", `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`);
    body.set("cancel_url", `${origin}/billing?cancel=true`);
    body.set("client_reference_id", authData.user.id);
    body.set("customer_email", authData.user.email);
    body.set("line_items[0][price]", priceId);
    body.set("line_items[0][quantity]", String(data.planName === "Team" ? data.seats || 1 : 1));
    body.set("allow_promotion_codes", "true");
    body.set("metadata[user_id]", authData.user.id);
    body.set("metadata[plan_name]", data.planName);
    body.set("metadata[billing_cycle]", data.cycle);
    body.set("metadata[trial_days]", String(trialDays));
    body.set("subscription_data[metadata][user_id]", authData.user.id);
    body.set("subscription_data[metadata][plan_name]", data.planName);
    body.set("subscription_data[metadata][billing_cycle]", data.cycle);
    if (trialDays > 0) body.set("subscription_data[trial_period_days]", String(trialDays));

    if (data.couponCode) {
      const localCoupon = await db.select().from(coupons)
        .where(and(eq(coupons.code, data.couponCode.toUpperCase()), eq(coupons.active, true)))
        .limit(1);
      if (localCoupon[0]?.stripe_promotion_code_id) {
        body.set("discounts[0][promotion_code]", localCoupon[0].stripe_promotion_code_id);
      }
    }

    const session = await stripeRequest<{ url: string }>("/checkout/sessions", body);
    return { url: session.url, mode: "stripe" };
  });

export const getBillingPortalFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");

    const activeSub = await getActiveSubscription(authData.user.id);
    const returnUrl = `${getOrigin()}/billing`;
    if (!activeSub?.stripe_customer_id || activeSub.stripe_customer_id.startsWith("mock_") || !process.env.STRIPE_SECRET_KEY) {
      return { url: returnUrl, mode: "local" };
    }

    const body = new URLSearchParams();
    body.set("customer", activeSub.stripe_customer_id);
    body.set("return_url", returnUrl);
    const portal = await stripeRequest<{ url: string }>("/billing_portal/sessions", body);
    return { url: portal.url, mode: "stripe" };
  });

export const cancelSubscriptionFn = createServerFn({ method: "POST" })
  .validator(z.object({
    atPeriodEnd: z.boolean().default(true),
  }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");

    const activeSub = await getActiveSubscription(authData.user.id);
    if (!activeSub) throw new Error("No active subscription found.");

    if (activeSub.stripe_subscription_id && !activeSub.stripe_subscription_id.startsWith("mock_") && process.env.STRIPE_SECRET_KEY) {
      const body = new URLSearchParams();
      body.set("cancel_at_period_end", data.atPeriodEnd ? "true" : "false");
      await stripeRequest(`/subscriptions/${activeSub.stripe_subscription_id}`, body);
    }

    await db.update(subscriptions).set({
      status: data.atPeriodEnd ? "active" : "canceled",
      updated_at: new Date(),
    }).where(eq(subscriptions.id, activeSub.id));
    await trackBillingEvent("subscription_cancelled", { atPeriodEnd: data.atPeriodEnd }, authData.user.id);
    await queueBillingEmail(authData.user.id, authData.user.email, "cancellation_confirmation", "Your AIRank subscription cancellation is scheduled", "Your subscription cancellation has been recorded.");

    return { success: true };
  });

export const changeSubscriptionPlanFn = createServerFn({ method: "POST" })
  .validator(z.object({
    planName: planSchema,
    cycle: cycleSchema,
  }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");

    const activeSub = await getActiveSubscription(authData.user.id);
    if (!activeSub) throw new Error("No active subscription found.");

    if (activeSub.stripe_subscription_id && !activeSub.stripe_subscription_id.startsWith("mock_") && process.env.STRIPE_SECRET_KEY) {
      throw new Error("Use Manage Billing to change an active Stripe subscription.");
    }

    await activateMockSubscription(authData.user.id, authData.user.email, data.planName, data.cycle, "mock_customer_id", "mock_subscription_id");
    await trackBillingEvent("subscription_updated", data, authData.user.id);
    return { success: true };
  });

async function activateMockSubscription(userId: string, email: string, planName: "Pro" | "Team", cycle: BillingCycle, customerId: string, subscriptionId: string) {
  const start = new Date();
  const end = cycle === "yearly" ? addMonths(start, 12) : addMonths(start, 1);
  const existing = await db.select().from(subscriptions).where(eq(subscriptions.user_id, userId)).limit(1);
  const values = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    plan_name: planName,
    status: "active",
    billing_cycle: cycle,
    current_period_start: start,
    current_period_end: end,
    updated_at: new Date(),
  };

  if (existing[0]) {
    await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing[0].id));
  } else {
    await db.insert(subscriptions).values({
      id: generateId(),
      user_id: userId,
      ...values,
    });
  }

  if (planName === "Team") {
    const workspace = await db.select().from(teamWorkspaces).where(eq(teamWorkspaces.owner_user_id, userId)).limit(1);
    if (!workspace[0]) {
      const workspaceId = generateId();
      await db.insert(teamWorkspaces).values({
        id: workspaceId,
        owner_user_id: userId,
        name: "AIRank Team Workspace",
        seats_purchased: 1,
      });
      await db.insert(teamMembers).values({
        id: generateId(),
        workspace_id: workspaceId,
        user_id: userId,
        email,
        role: "owner",
        status: "active",
        joined_at: new Date(),
      });
    }
  }

  await trackBillingEvent("subscription_created", { planName, cycle, local: true }, userId);
  await queueBillingEmail(userId, email, "subscription_activated", "Your AIRank subscription is active", `Your ${planName} subscription is active.`);

  const revenueCents = planName === "Team"
    ? (cycle === "yearly" ? PLANS.TEAM.yearly_price : PLANS.TEAM.monthly_price) * 100
    : (cycle === "yearly" ? PLANS.PRO.yearly_price : PLANS.PRO.monthly_price) * 100;
  const { convertReferral } = await import("./referral.functions");
  await convertReferral(userId, revenueCents);
}

export const activateMockSubscriptionFn = createServerFn({ method: "POST" })
  .validator(z.object({
    planName: planSchema,
    cycle: cycleSchema,
  }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");
    await activateMockSubscription(authData.user.id, authData.user.email, data.planName, data.cycle, "mock_customer_id", `mock_${data.planName.toLowerCase()}_${data.cycle}`);
    return { success: true };
  });

export const getPaymentHistoryFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");

    const rows = await db.select().from(paymentHistory)
      .where(eq(paymentHistory.user_id, authData.user.id))
      .orderBy(desc(paymentHistory.created_at))
      .limit(20);
    return rows;
  });

export const inviteTeamMemberFn = createServerFn({ method: "POST" })
  .validator(z.object({
    email: z.string().email(),
    role: z.enum(["admin", "member"]).default("member"),
  }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");

    const status = await getSubscriptionStatusFn();
    if (status.plan !== "Team") throw new Error("Team billing is available on the Team plan.");
    if (!status.team) throw new Error("Team workspace was not created yet.");
    if (status.team.activeSeats >= status.team.seats_purchased) throw new Error("Seat limit reached. Manage seats from billing.");

    await db.insert(teamMembers).values({
      id: generateId(),
      workspace_id: status.team.id,
      email: data.email,
      role: data.role,
      status: "invited",
    });
    await queueBillingEmail(null, data.email, "team_invite", "You were invited to AIRank", `${authData.user.name} invited you to join their AIRank workspace.`);
    return { success: true };
  });

export const updateTeamSeatsFn = createServerFn({ method: "POST" })
  .validator(z.object({
    seats: z.number().int().min(1).max(100),
  }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");

    const workspace = await db.select().from(teamWorkspaces).where(eq(teamWorkspaces.owner_user_id, authData.user.id)).limit(1);
    if (!workspace[0]) throw new Error("Team workspace not found.");
    await db.update(teamWorkspaces).set({ seats_purchased: data.seats, updated_at: new Date() }).where(eq(teamWorkspaces.id, workspace[0].id));
    await trackBillingEvent("team_seats_updated", { seats: data.seats }, authData.user.id);
    return { success: true };
  });

export const removeTeamMemberFn = createServerFn({ method: "POST" })
  .validator(z.object({ memberId: z.string() }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");
    const workspace = await db.select().from(teamWorkspaces).where(eq(teamWorkspaces.owner_user_id, authData.user.id)).limit(1);
    if (!workspace[0]) throw new Error("Team workspace not found.");
    await db.update(teamMembers).set({ status: "removed" }).where(and(eq(teamMembers.id, data.memberId), eq(teamMembers.workspace_id, workspace[0].id)));
    return { success: true };
  });

export const getRevenueMetricsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");

    const { isAdmin } = await import("../security/authz");
    const adminCheck = await isAdmin(authData.user.id);
    if (!adminCheck) throw new Error("Admin privileges required.");

    const allSubs = await db.select().from(subscriptions);
    const activeSubs = allSubs.filter((sub) => activeStatuses().includes(sub.status));
    const trials = allSubs.filter((sub) => sub.status === "trialing");
    const canceledSubs = allSubs.filter((sub) => sub.status === "canceled");

    const monthlyValue = (sub: typeof subscriptions.$inferSelect) => {
      if (sub.plan_name === "Team") return sub.billing_cycle === "yearly" ? PLANS.TEAM.yearly_price / 12 : PLANS.TEAM.monthly_price;
      if (sub.plan_name === "Pro") return sub.billing_cycle === "yearly" ? PLANS.PRO.yearly_price / 12 : PLANS.PRO.monthly_price;
      return 0;
    };
    const mrr = Math.round(activeSubs.reduce((sum, sub) => sum + monthlyValue(sub), 0));
    const paidInvoices = await db.select().from(paymentHistory).where(eq(paymentHistory.status, "paid"));
    const failedInvoices = await db.select().from(paymentHistory).where(eq(paymentHistory.status, "failed"));
    const recentEvents = await db.select().from(billingEvents).orderBy(desc(billingEvents.created_at)).limit(20);

    const checkoutCompleted = recentEvents.filter((event) => event.event_name === "checkout_completed").length;
    const trialStarted = recentEvents.filter((event) => event.event_name === "trial_started").length;
    const trialConversions = trialStarted > 0 ? Math.round((checkoutCompleted / trialStarted) * 100) : 0;
    const churnRate = allSubs.length > 0 ? Math.round((canceledSubs.length / allSubs.length) * 100) : 0;

    const revenueGrowthRows = await db.select({
      month: sql<string>`strftime('%Y-%m', datetime(created_at, 'unixepoch'))`,
      revenue: sql<number>`coalesce(sum(amount_paid), 0)`,
    }).from(paymentHistory)
      .where(gte(paymentHistory.created_at, addMonths(new Date(), -6)))
      .groupBy(sql`strftime('%Y-%m', datetime(created_at, 'unixepoch'))`);

    return {
      mrr,
      arr: mrr * 12,
      activeSubscribers: activeSubs.length,
      churnRate,
      trialConversions,
      trials: trials.length,
      revenueGrowth: revenueGrowthRows.map((row) => ({
        month: row.month,
        revenue: Math.round(Number(row.revenue) / 100),
      })),
      failedPayments: failedInvoices.length,
      totalRevenue: Math.round(paidInvoices.reduce((sum, invoice) => sum + invoice.amount_paid, 0) / 100),
      recentEvents,
    };
  });
