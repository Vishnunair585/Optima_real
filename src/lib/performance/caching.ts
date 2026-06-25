import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import { db } from "../db";
import { stacks, stackTools, stackLikes, stackBookmarks, stackComments, users, analyticsEvents, systemLogs } from "../db/schema";
import { globalCache } from "../cache";

const CACHE_TTL = {
  POPULAR_TOOLS: 300_000,
  CATEGORIES: 600_000,
  PUBLIC_STACKS: 120_000,
  RANKINGS: 300_000,
  ANALYTICS_SUMMARIES: 900_000,
};

export async function getCachedOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number, tags?: string[]): Promise<T> {
  const cached = globalCache.get<T>(key);
  if (cached !== undefined) return cached;
  const data = await fetchFn();
  globalCache.set(key, data, ttlMs, tags);
  return data;
}

export const invalidateCacheTagFn = createServerFn({ method: "POST" })
  .validator(z.object({ tag: z.string() }))
  .handler(async ({ data }) => {
    globalCache.invalidateTag(data.tag);
    return { success: true };
  });

export function invalidateOnStackChange(stackId?: string): void {
  globalCache.invalidateTag("stacks");
  globalCache.invalidateTag("leaderboard");
  globalCache.invalidateTag("categories");
  if (stackId) globalCache.invalidateTag(`stack:${stackId}`);
}

export function invalidateOnToolChange(): void {
  globalCache.invalidateTag("popular_tools");
  globalCache.invalidateTag("rankings");
}

export function invalidateOnSubscriptionChange(userId: string): void {
  globalCache.invalidateTag(`subscription:${userId}`);
  globalCache.invalidateTag("analytics");
}

export const getCachedCategoriesFn = createServerFn({ method: "GET" })
  .handler(async () => {
    return getCachedOrFetch(
      "categories",
      async () => {
        const result = await db.select({ category: stacks.category })
          .from(stacks)
          .where(eq(stacks.is_public, true))
          .groupBy(stacks.category)
          .orderBy(stacks.category);
        return result.map(r => r.category);
      },
      CACHE_TTL.CATEGORIES,
      ["categories"],
    );
  });

export const getCachedPublicStacksFn = createServerFn({ method: "GET" })
  .validator(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
  .handler(async ({ data }) => {
    const cacheKey = `public_stacks:${data.limit}:${data.offset}`;
    return getCachedOrFetch(
      cacheKey,
      async () => {
        const results = await db.select({
          id: stacks.id,
          name: stacks.name,
          description: stacks.description,
          category: stacks.category,
          difficulty_level: stacks.difficulty_level,
          likes_count: stacks.likes_count,
          views_count: stacks.views_count,
          created_at: stacks.created_at,
          creator_name: users.name,
          creator_avatar: users.avatar,
        })
          .from(stacks)
          .leftJoin(users, eq(stacks.user_id, users.id))
          .where(eq(stacks.is_public, true))
          .orderBy(desc(stacks.likes_count))
          .limit(data.limit)
          .offset(data.offset);

        return results;
      },
      CACHE_TTL.PUBLIC_STACKS,
      ["stacks", "public_stacks"],
    );
  });

export const getCachedAnalyticsSummaryFn = createServerFn({ method: "GET" })
  .handler(async () => {
    return getCachedOrFetch(
      "analytics_summary",
      async () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [totalUsers, totalStacks, totalComparisons, totalViews, recentUsers, recentStacks] = await Promise.all([
          db.select({ count: count() }).from(users).then(r => Number(r[0]?.count || 0)),
          db.select({ count: count() }).from(stacks).then(r => Number(r[0]?.count || 0)),
          db.select({ count: count() }).from(stacks).then(r => Number(r[0]?.count || 0)),
          db.select({ total: sql<number>`coalesce(sum(${stacks.views_count}), 0)` }).from(stacks).then(r => Number(r[0]?.total || 0)),
          db.select({ count: count() }).from(users).where(gte(users.created_at, weekAgo)).then(r => Number(r[0]?.count || 0)),
          db.select({ count: count() }).from(stacks).where(gte(stacks.created_at, weekAgo)).then(r => Number(r[0]?.count || 0)),
        ]);

        return { totalUsers, totalStacks, totalComparisons, totalViews, newUsers7d: recentUsers, newStacks7d: recentStacks };
      },
      CACHE_TTL.ANALYTICS_SUMMARIES,
      ["analytics"],
    );
  });
