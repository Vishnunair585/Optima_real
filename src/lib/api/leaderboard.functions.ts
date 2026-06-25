import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";
import { users, userProfiles, stacks, toolComparisons, stackLikes } from "../db/schema";
import { eq, and, count, desc, sql, gte, inArray } from "drizzle-orm";

async function getSession() {
  const { getCurrentSession } = await import("../../server/auth/session.server");
  return getCurrentSession();
}

export const getLeaderboardFn = createServerFn({ method: "GET" })
  .validator(z.object({
    tab: z.enum(["curators", "stacks", "referrals"]).default("curators"),
    period: z.enum(["monthly", "all_time"]).default("all_time"),
  }))
  .handler(async ({ data }) => {
    const since = data.period === "monthly"
      ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      : new Date(0);

    if (data.tab === "curators") {
      const rows = await db.select({
        user_id: stacks.user_id,
        stack_count: count(stacks.id),
        total_likes: sql<number>`coalesce(sum(${stacks.likes_count}), 0)`,
        total_views: sql<number>`coalesce(sum(${stacks.views_count}), 0)`,
      })
        .from(stacks)
        .where(and(
          eq(stacks.is_public, true),
          gte(stacks.created_at, since),
        ))
        .groupBy(stacks.user_id)
        .orderBy(desc(count(stacks.id)))
        .limit(50);

      const leaders = await Promise.all(rows.map(async (row, index) => {
        const user = await db.select().from(users).where(eq(users.id, row.user_id!)).limit(1);
        const profile = await db.select().from(userProfiles).where(eq(userProfiles.user_id, row.user_id!)).limit(1);
        return {
          rank: index + 1,
          userId: row.user_id,
          name: profile[0]?.username || user[0]?.name || "Anonymous",
          avatar: user[0]?.avatar || profile[0]?.avatar_url,
          score: Number(row.stack_count),
          label: `${row.stack_count} stack${row.stack_count === 1 ? "" : "s"}`,
          sublabel: `${row.total_likes} likes · ${row.total_views} views`,
        };
      }));

      const authData = await getSession();
      const myRank = authData ? leaders.findIndex(l => l.userId === authData.user.id) + 1 || null : null;
      return { leaders, tab: "curators", period: data.period, my_rank: myRank };
    }

    if (data.tab === "stacks") {
      const rows = await db.select({
        id: stacks.id,
        name: stacks.name,
        user_id: stacks.user_id,
        likes_count: stacks.likes_count,
        views_count: stacks.views_count,
        category: stacks.category,
        created_at: stacks.created_at,
      })
        .from(stacks)
        .where(and(
          eq(stacks.is_public, true),
          gte(stacks.created_at, since),
        ))
        .orderBy(desc(stacks.likes_count), desc(stacks.views_count))
        .limit(50);

      const leaders = await Promise.all(rows.map(async (row, index) => {
        const user = await db.select().from(users).where(eq(users.id, row.user_id!)).limit(1);
        const profile = await db.select().from(userProfiles).where(eq(userProfiles.user_id, row.user_id!)).limit(1);
        return {
          rank: index + 1,
          id: row.id,
          name: row.name,
          creatorName: profile[0]?.username || user[0]?.name || "Anonymous",
          creatorAvatar: user[0]?.avatar || profile[0]?.avatar_url,
          category: row.category,
          likes: row.likes_count,
          views: row.views_count,
        };
      }));

      return { leaders, tab: "stacks", period: data.period, my_rank: null };
    }

    // referrals tab - existing logic
    const { referrals, referralCodes, QUALIFIED_STATUSES } = await import("../db/schema");
    const qualifiedStatuses = ["paid", "active_subscriber", "active_trial", "converted"];

    const rows = await db.select({
      referrer_user_id: referrals.referrer_user_id,
      qualified: count(referrals.id),
      conversions: sql<number>`sum(case when ${referrals.status} = 'converted' then 1 else 0 end)`,
      revenue: sql<number>`sum(${referrals.revenue_cents})`,
    }).from(referrals)
      .where(and(
        inArray(referrals.status, [...qualifiedStatuses, "signed_up", "converted"]),
        gte(referrals.created_at, since),
      ))
      .groupBy(referrals.referrer_user_id)
      .orderBy(desc(count(referrals.id)))
      .limit(50);

    const leaders = await Promise.all(rows.map(async (row, index) => {
      const profile = await db.select().from(userProfiles).where(eq(userProfiles.user_id, row.referrer_user_id)).limit(1);
      const user = await db.select().from(users).where(eq(users.id, row.referrer_user_id)).limit(1);
      const code = await db.select().from(referralCodes).where(eq(referralCodes.user_id, row.referrer_user_id)).limit(1);
      return {
        rank: index + 1,
        userId: row.referrer_user_id,
        name: profile[0]?.username || user[0]?.name || "Anonymous",
        avatar: user[0]?.avatar || profile[0]?.avatar_url,
        referralCode: code[0]?.code || "",
        score: Number(row.qualified),
        label: `${row.qualified} referral${row.qualified === 1 ? "" : "s"}`,
        sublabel: `${Number(row.conversions) || 0} converted`,
      };
    }));

    const authData = await getSession();
    const myRank = authData ? leaders.findIndex(l => l.userId === authData.user.id) + 1 || null : null;
    return { leaders, tab: "referrals", period: data.period, my_rank: myRank };
  });
