import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";
import { toolComparisons } from "../db/schema";
import { eq } from "drizzle-orm";
import { getCurrentSession } from "../../server/auth/session.server";
import { generateId } from "../../server/auth/crypto.server";
import { checkRateLimit } from "../../server/auth/rate-limit.server";
import { getRequestHeader } from "@tanstack/react-start/server";

export const saveComparisonFn = createServerFn({ method: "POST" })
  .validator(z.object({
    name: z.string().min(1).max(100),
    tools: z.array(z.string()).min(2).max(4),
  }))
  .handler(async ({ data }) => {
    const authData = await getCurrentSession();
    if (!authData) {
      throw new Error("Please log in to save comparisons.");
    }

    const ip = getRequestHeader("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`save-compare:${authData.user.id}`, 20, 1000 * 60 * 15)) {
      throw new Error("Too many saves. Try again later.");
    }

    const slug = data.tools.map(t => t.toLowerCase().replace(/[\s.]+/g, "-")).join("-vs-");

    // Check if comparison with this slug already exists for this user
    const existing = await db.select().from(toolComparisons)
      .where(eq(toolComparisons.slug, slug));

    if (existing.length > 0 && existing[0].user_id === authData.user.id) {
      return { success: true, id: existing[0].id, slug };
    }

    const id = generateId();
    await db.insert(toolComparisons).values({
      id,
      user_id: authData.user.id,
      comparison_name: data.name,
      tool_ids: JSON.stringify(data.tools),
      slug,
    });

    return { success: true, id, slug };
  });

export const getComparisonBySlugFn = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.select().from(toolComparisons)
      .where(eq(toolComparisons.slug, data.slug));

    if (result.length === 0) return null;

    // Increment view count
    await db.update(toolComparisons)
      .set({ view_count: result[0].view_count + 1 })
      .where(eq(toolComparisons.id, result[0].id));

    return {
      ...result[0],
      tool_ids: JSON.parse(result[0].tool_ids) as string[],
    };
  });

export const getSavedComparisonsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getCurrentSession();
    if (!authData) return [];

    const results = await db.select().from(toolComparisons)
      .where(eq(toolComparisons.user_id, authData.user.id));

    return results.map(r => ({
      ...r,
      tool_ids: JSON.parse(r.tool_ids) as string[],
    }));
  });

export const deleteComparisonFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const authData = await getCurrentSession();
    if (!authData) throw new Error("Unauthorized");

    const result = await db.select().from(toolComparisons)
      .where(eq(toolComparisons.id, data.id));

    if (result.length === 0) throw new Error("Not found");
    if (result[0].user_id !== authData.user.id) throw new Error("Unauthorized");

    await db.delete(toolComparisons).where(eq(toolComparisons.id, data.id));
    return { success: true };
  });
