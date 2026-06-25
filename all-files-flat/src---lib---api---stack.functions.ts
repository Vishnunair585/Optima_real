import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";
import { stacks, stackTools, stackLikes, stackBookmarks, stackComments, users } from "../db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
const generateId = () => crypto.randomUUID();

async function getSession() {
  const { getCurrentSession } = await import("../../server/auth/session.server");
  return getCurrentSession();
}

async function rateLimit(key: string, limit: number, windowMs: number) {
  const { checkRateLimit } = await import("../../server/auth/rate-limit.server");
  return checkRateLimit(key, limit, windowMs);
}
import { getRequestHeader } from "@tanstack/react-start/server";
import { AI_TOOLS } from "../data/tools";
import { canUseFeature, recordFeatureUsage } from "./billing.functions";

// Type definitions matching database outputs
export interface StackTool {
  id: string;
  stack_id: string;
  tool_id: string;
  position: number;
  purpose: string;
}

export interface StackComment {
  id: string;
  stack_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: Date;
  user: {
    name: string;
    avatar: string | null;
  };
  replies?: StackComment[];
}

export interface StackDetail {
  id: string;
  user_id: string | null;
  name: string;
  description: string;
  goal: string;
  category: string;
  difficulty_level: string;
  is_public: boolean;
  likes_count: number;
  views_count: number;
  featured: boolean;
  created_at: Date;
  updated_at: Date;
  tools: StackTool[];
  comments: StackComment[];
  creator_name?: string;
  creator_avatar?: string | null;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

// Helper: check if user is admin
async function isAdmin(userId: string) {
  const { isAdmin: checkAdmin } = await import("../security/authz");
  return checkAdmin(userId);
}

export const createStackFn = createServerFn({ method: "POST" })
  .validator(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().default(""),
    goal: z.string().min(1),
    category: z.string().min(1),
    difficulty_level: z.enum(["Beginner", "Intermediate", "Advanced"]),
    is_public: z.boolean(),
    tools: z.array(z.object({
      tool_id: z.string(),
      position: z.number(),
      purpose: z.string()
    })).min(1)
  }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Please log in to save stacks.");

    const ip = getRequestHeader("x-forwarded-for") || "unknown";
    if (!await rateLimit(`create-stack:${authData.user.id}`, 20, 1000 * 60 * 15)) {
      throw new Error("Too many stacks created. Try again later.");
    }

    const gate = await recordFeatureUsage(authData.user.id, "stack", { name: data.name, category: data.category });
    if (!gate.allowed) {
      return {
        success: false,
        paywall: true,
        reason: gate.reason,
        limit: gate.limit,
        current: gate.current,
        reset_at: gate.reset_at,
      };
    }

    const stackId = generateId();

    await db.insert(stacks).values({
      id: stackId,
      user_id: authData.user.id,
      name: data.name,
      description: data.description,
      goal: data.goal,
      category: data.category,
      difficulty_level: data.difficulty_level,
      is_public: data.is_public,
    });

    for (const t of data.tools) {
      await db.insert(stackTools).values({
        id: generateId(),
        stack_id: stackId,
        tool_id: t.tool_id,
        position: t.position,
        purpose: t.purpose,
      });
    }

    return { success: true, stackId };
  });

export const updateStackFn = createServerFn({ method: "POST" })
  .validator(z.object({
    id: z.string(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().default(""),
    goal: z.string().min(1),
    category: z.string().min(1),
    difficulty_level: z.enum(["Beginner", "Intermediate", "Advanced"]),
    is_public: z.boolean(),
    tools: z.array(z.object({
      tool_id: z.string(),
      position: z.number(),
      purpose: z.string()
    })).min(1)
  }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");

    const existing = await db.select().from(stacks).where(eq(stacks.id, data.id));
    if (existing.length === 0) throw new Error("Stack not found");

    const userIsAdmin = await isAdmin(authData.user.id);
    if (existing[0].user_id !== authData.user.id && !userIsAdmin) {
      throw new Error("Unauthorized");
    }

    // Update stack properties
    await db.update(stacks).set({
      name: data.name,
      description: data.description,
      goal: data.goal,
      category: data.category,
      difficulty_level: data.difficulty_level,
      is_public: data.is_public,
      updated_at: new Date()
    }).where(eq(stacks.id, data.id));

    // Re-create tools
    await db.delete(stackTools).where(eq(stackTools.stack_id, data.id));
    for (const t of data.tools) {
      await db.insert(stackTools).values({
        id: generateId(),
        stack_id: data.id,
        tool_id: t.tool_id,
        position: t.position,
        purpose: t.purpose,
      });
    }

    return { success: true };
  });

export const deleteStackFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");

    const existing = await db.select().from(stacks).where(eq(stacks.id, data.id));
    if (existing.length === 0) throw new Error("Stack not found");

    const userIsAdmin = await isAdmin(authData.user.id);
    if (existing[0].user_id !== authData.user.id && !userIsAdmin) {
      throw new Error("Unauthorized");
    }

    await db.delete(stacks).where(eq(stacks.id, data.id));
    return { success: true };
  });

export const duplicateStackFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Please log in to duplicate stacks.");

    const gate = await recordFeatureUsage(authData.user.id, "stack", { duplicatedStackId: data.id });
    if (!gate.allowed) {
      return {
        success: false,
        paywall: true,
        reason: gate.reason,
        limit: gate.limit,
        current: gate.current,
        reset_at: gate.reset_at,
      };
    }

    const existing = await db.select().from(stacks).where(eq(stacks.id, data.id));
    if (existing.length === 0) throw new Error("Stack not found");

    const tools = await db.select().from(stackTools).where(eq(stackTools.stack_id, data.id));

    const newStackId = generateId();
    await db.insert(stacks).values({
      id: newStackId,
      user_id: authData.user.id,
      name: `Copy of ${existing[0].name}`,
      description: existing[0].description,
      goal: existing[0].goal,
      category: existing[0].category,
      difficulty_level: existing[0].difficulty_level,
      is_public: false, // Default duplicates to private draft
    });

    for (const t of tools) {
      await db.insert(stackTools).values({
        id: generateId(),
        stack_id: newStackId,
        tool_id: t.tool_id,
        position: t.position,
        purpose: t.purpose,
      });
    }

    return { success: true, newStackId };
  });

export const getStackByIdOrSlugFn = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    
    // Find stack either by exact ID or if name converts to this slug
    // We can run a query to fetch the stack
    let result = await db.select().from(stacks).where(eq(stacks.id, data.id));
    
    if (result.length === 0) {
      // Try slug match: name-to-slug transformation
      const allStacks = await db.select().from(stacks);
      const match = allStacks.find(s => {
        const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return slug === data.id;
      });
      if (match) {
        result = [match];
      }
    }

    if (result.length === 0) return null;
    const stack = result[0];

    // Increment views
    await db.update(stacks).set({ views_count: stack.views_count + 1 }).where(eq(stacks.id, stack.id));

    const toolsList = await db.select().from(stackTools)
      .where(eq(stackTools.stack_id, stack.id))
      .orderBy(stackTools.position);

    // Get Creator Info
    let creator_name = "Anonymous";
    let creator_avatar = null;
    if (stack.user_id) {
      const creator = await db.select().from(users).where(eq(users.id, stack.user_id));
      if (creator.length > 0) {
        creator_name = creator[0].name;
        creator_avatar = creator[0].avatar;
      }
    }

    // Get Comments with User details
    const rawComments = await db.select({
      id: stackComments.id,
      stack_id: stackComments.stack_id,
      user_id: stackComments.user_id,
      parent_id: stackComments.parent_id,
      content: stackComments.content,
      created_at: stackComments.created_at,
      userName: users.name,
      userAvatar: users.avatar
    })
    .from(stackComments)
    .innerJoin(users, eq(stackComments.user_id, users.id))
    .where(eq(stackComments.stack_id, stack.id))
    .orderBy(desc(stackComments.created_at));

    const comments: StackComment[] = rawComments.map(c => ({
      id: c.id,
      stack_id: c.stack_id,
      user_id: c.user_id,
      parent_id: c.parent_id,
      content: c.content,
      created_at: c.created_at,
      user: {
        name: c.userName,
        avatar: c.userAvatar
      }
    }));

    // Organize comments hierarchically
    const commentMap = new Map<string, StackComment>();
    const rootComments: StackComment[] = [];

    comments.forEach(c => {
      c.replies = [];
      commentMap.set(c.id, c);
    });

    comments.forEach(c => {
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id)!.replies!.push(c);
      } else {
        rootComments.push(c);
      }
    });

    let isLiked = false;
    let isBookmarked = false;

    if (authData) {
      const likeRecord = await db.select().from(stackLikes).where(
        and(eq(stackLikes.stack_id, stack.id), eq(stackLikes.user_id, authData.user.id))
      );
      isLiked = likeRecord.length > 0;

      const bookmarkRecord = await db.select().from(stackBookmarks).where(
        and(eq(stackBookmarks.stack_id, stack.id), eq(stackBookmarks.user_id, authData.user.id))
      );
      isBookmarked = bookmarkRecord.length > 0;
    }

    return {
      ...stack,
      tools: toolsList,
      comments: rootComments,
      creator_name,
      creator_avatar,
      isLiked,
      isBookmarked
    } as StackDetail;
  });

export const getStacksFn = createServerFn({ method: "GET" })
  .validator(z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    difficulty: z.string().optional(),
    sortBy: z.enum(["latest", "popular", "featured"]).optional().default("latest"),
    userId: z.string().optional(),
    likedByUserId: z.string().optional(),
    savedByUserId: z.string().optional(),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0)
  }))
  .handler(async ({ data }) => {
    // We construct a query
    // SQLite queries with drizzle
    let query = db.select({
      id: stacks.id,
      user_id: stacks.user_id,
      name: stacks.name,
      description: stacks.description,
      goal: stacks.goal,
      category: stacks.category,
      difficulty_level: stacks.difficulty_level,
      is_public: stacks.is_public,
      likes_count: stacks.likes_count,
      views_count: stacks.views_count,
      featured: stacks.featured,
      created_at: stacks.created_at,
      updated_at: stacks.updated_at,
      creator_name: users.name,
      creator_avatar: users.avatar,
    })
    .from(stacks)
    .leftJoin(users, eq(stacks.user_id, users.id));

    // Filter clauses
    const filters = [];

    // Unless requesting a specific user's stacks, only show public ones
    if (!data.userId && !data.likedByUserId && !data.savedByUserId) {
      filters.push(eq(stacks.is_public, true));
    }

    if (data.userId) {
      filters.push(eq(stacks.user_id, data.userId));
    }

    if (data.category && data.category !== "All") {
      filters.push(eq(stacks.category, data.category));
    }

    if (data.difficulty && data.difficulty !== "All") {
      filters.push(eq(stacks.difficulty_level, data.difficulty));
    }

    if (data.search) {
      filters.push(or(
        sql`${stacks.name} LIKE ${`%${data.search}%`}`,
        sql`${stacks.description} LIKE ${`%${data.search}%`}`
      ));
    }

    // Build query with filters
    let finalQuery: any;
    if (filters.length > 0) {
      finalQuery = query.where(and(...filters));
    } else {
      finalQuery = query;
    }

    // Sorting
    if (data.sortBy === "popular") {
      finalQuery = finalQuery.orderBy(desc(stacks.likes_count), desc(stacks.views_count));
    } else if (data.sortBy === "featured") {
      finalQuery = finalQuery.orderBy(desc(stacks.featured), desc(stacks.created_at));
    } else {
      finalQuery = finalQuery.orderBy(desc(stacks.created_at));
    }

    const results = await finalQuery.limit(data.limit).offset(data.offset);

    // Fetch tool count for each stack
    const mappedResults = [];
    for (const r of results) {
      const tools = await db.select().from(stackTools).where(eq(stackTools.stack_id, r.id));
      mappedResults.push({
        ...r,
        toolCount: tools.length,
        tools: tools
      });
    }

    // Filter by likedByUserId or savedByUserId if requested (done in memory or with subqueries)
    let filtered = mappedResults;
    if (data.likedByUserId) {
      const likedStackIds = (await db.select({ stack_id: stackLikes.stack_id })
        .from(stackLikes)
        .where(eq(stackLikes.user_id, data.likedByUserId))).map(x => x.stack_id);
      filtered = filtered.filter(f => likedStackIds.includes(f.id));
    }
    if (data.savedByUserId) {
      const savedStackIds = (await db.select({ stack_id: stackBookmarks.stack_id })
        .from(stackBookmarks)
        .where(eq(stackBookmarks.user_id, data.savedByUserId))).map(x => x.stack_id);
      filtered = filtered.filter(f => savedStackIds.includes(f.id));
    }

    return filtered;
  });

export const toggleLikeStackFn = createServerFn({ method: "POST" })
  .validator(z.object({ stackId: z.string() }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Please log in to like stacks.");

    const existing = await db.select().from(stackLikes).where(
      and(eq(stackLikes.stack_id, data.stackId), eq(stackLikes.user_id, authData.user.id))
    );

    const stackRecord = await db.select().from(stacks).where(eq(stacks.id, data.stackId));
    if (stackRecord.length === 0) throw new Error("Stack not found");

    if (existing.length > 0) {
      // Unlike
      await db.delete(stackLikes).where(eq(stackLikes.id, existing[0].id));
      await db.update(stacks).set({ likes_count: Math.max(0, stackRecord[0].likes_count - 1) }).where(eq(stacks.id, data.stackId));
      return { liked: false };
    } else {
      // Like
      await db.insert(stackLikes).values({
        id: generateId(),
        stack_id: data.stackId,
        user_id: authData.user.id,
      });
      await db.update(stacks).set({ likes_count: stackRecord[0].likes_count + 1 }).where(eq(stacks.id, data.stackId));
      return { liked: true };
    }
  });

export const toggleBookmarkStackFn = createServerFn({ method: "POST" })
  .validator(z.object({ stackId: z.string() }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Please log in to bookmark stacks.");

    const existing = await db.select().from(stackBookmarks).where(
      and(eq(stackBookmarks.stack_id, data.stackId), eq(stackBookmarks.user_id, authData.user.id))
    );

    if (existing.length > 0) {
      await db.delete(stackBookmarks).where(eq(stackBookmarks.id, existing[0].id));
      return { bookmarked: false };
    } else {
      await db.insert(stackBookmarks).values({
        id: generateId(),
        stack_id: data.stackId,
        user_id: authData.user.id,
      });
      return { bookmarked: true };
    }
  });

export const addCommentFn = createServerFn({ method: "POST" })
  .validator(z.object({
    stackId: z.string(),
    content: z.string().min(1).max(1000),
    parentId: z.string().optional()
  }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Please log in to post comments.");

    const ip = getRequestHeader("x-forwarded-for") || "unknown";
    if (!await rateLimit(`comment:${authData.user.id}`, 10, 1000 * 60 * 5)) {
      throw new Error("Posting too fast. Take a break.");
    }

    const commentId = generateId();
    await db.insert(stackComments).values({
      id: commentId,
      stack_id: data.stackId,
      user_id: authData.user.id,
      parent_id: data.parentId || null,
      content: data.content,
    });

    return { success: true, commentId };
  });

export const deleteCommentFn = createServerFn({ method: "POST" })
  .validator(z.object({ commentId: z.string() }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");

    const existing = await db.select().from(stackComments).where(eq(stackComments.id, data.commentId));
    if (existing.length === 0) throw new Error("Comment not found");

    const userIsAdmin = await isAdmin(authData.user.id);
    if (existing[0].user_id !== authData.user.id && !userIsAdmin) {
      throw new Error("Unauthorized");
    }

    // Delete comment and its nested replies (cascaded delete handled or we delete parent_id matches)
    await db.delete(stackComments).where(eq(stackComments.parent_id, data.commentId));
    await db.delete(stackComments).where(eq(stackComments.id, data.commentId));

    return { success: true };
  });

export const updateFeaturedStatusFn = createServerFn({ method: "POST" })
  .validator(z.object({ stackId: z.string(), featured: z.boolean() }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) throw new Error("Unauthorized");

    const userIsAdmin = await isAdmin(authData.user.id);
    if (!userIsAdmin) throw new Error("Admin privileges required.");

    await db.update(stacks).set({ featured: data.featured }).where(eq(stacks.id, data.stackId));
    return { success: true };
  });

// Heuristics-based AI Recommendation Engine
export const getRecommendationsFn = createServerFn({ method: "POST" })
  .validator(z.object({
    userType: z.string(),
    goals: z.array(z.string()),
    experienceLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
    favoriteTools: z.array(z.string()),
    categories: z.array(z.string()),
  }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    // Try to track usage, but don't block if billing/usage DB fails
    if (authData) {
      try {
        const gate = await canUseFeature(authData.user.id, "premium_feature");
        if (gate.allowed) {
          await recordFeatureUsage(authData.user.id, "premium_feature", { recommendationType: data.userType });
        }
      } catch {
        // Silently continue - recommendations should work even if usage tracking fails
      }
    }

    const recommendedTools: typeof AI_TOOLS = [];

    // Filter tools based on parameters
    const getToolsByCategory = (cat: string) => AI_TOOLS.filter(t => t.category === cat);

    // 1. Target key roles/types
    if (data.userType === "Developer") {
      recommendedTools.push(...getToolsByCategory("Coding").slice(0, 2));
      recommendedTools.push(...getToolsByCategory("AI App Builders").slice(0, 2));
      recommendedTools.push(...getToolsByCategory("Automation").slice(0, 1));
    } else if (data.userType === "Content Creator") {
      recommendedTools.push(...getToolsByCategory("Writing").slice(0, 1));
      recommendedTools.push(...getToolsByCategory("Image").slice(0, 1));
      recommendedTools.push(...getToolsByCategory("Video").slice(0, 2));
    } else if (data.userType === "Startup Founder" || data.userType === "Founder") {
      recommendedTools.push(...getToolsByCategory("AI App Builders").slice(0, 1));
      recommendedTools.push(...getToolsByCategory("Automation").slice(0, 1));
      recommendedTools.push(...getToolsByCategory("Writing").slice(0, 1));
      recommendedTools.push(...getToolsByCategory("Data Analysis").slice(0, 1));
    } else if (data.userType === "Designer") {
      recommendedTools.push(...getToolsByCategory("Image").slice(0, 2));
      recommendedTools.push(...getToolsByCategory("AI Website Builders").slice(0, 1));
    } else {
      // General user or Student
      recommendedTools.push(...getToolsByCategory("Research").slice(0, 2));
      recommendedTools.push(...getToolsByCategory("Writing").slice(0, 1));
    }

    // 2. Adjust for categories chosen
    data.categories.forEach(cat => {
      const matching = getToolsByCategory(cat).slice(0, 1);
      matching.forEach(m => {
        if (!recommendedTools.find(t => t.name === m.name)) {
          recommendedTools.push(m);
        }
      });
    });

    // 3. Inject user's favorite tools if they exist in catalog
    data.favoriteTools.forEach(fav => {
      const found = AI_TOOLS.find(t => t.name.toLowerCase() === fav.toLowerCase());
      if (found && !recommendedTools.find(t => t.name === found.name)) {
        recommendedTools.unshift(found); // Prioritize favorite tools
      }
    });

    // 4. Filter by difficulty level
    let finalSelection = recommendedTools.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i); // Unique

    if (data.experienceLevel === "Beginner") {
      // Filter out complex agents/Enterprise tools like Devin
      finalSelection = finalSelection.filter(t => t.name !== "Devin");
    }

    // Limit to 4 tools in the recommended stack; fallback to top-rated tools if empty
    let finalStackTools = finalSelection.slice(0, 4);
    if (finalStackTools.length === 0) {
      const categoryPool = data.categories.length > 0
        ? AI_TOOLS.filter(t => data.categories.includes(t.category))
        : AI_TOOLS;
      finalStackTools = [...categoryPool]
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
    }
    if (finalStackTools.length === 0) {
      finalStackTools = [...AI_TOOLS].sort((a, b) => b.score - a.score).slice(0, 4);
    }

    // Provide workflow sequences purpose based on categories
    const purposesMap: Record<string, string> = {
      "Coding": "Coding assistant & development",
      "Writing": "Content drafting & editing",
      "Research": "Market research & citations",
      "AI Agents": "Automating multi-step workflows",
      "AI App Builders": "Frontend & backend construction",
      "AI Website Builders": "Deploying landing pages",
      "Data Analysis": "Data insights & charting",
      "Automation": "Connecting application APIs",
      "Image": "Hero & asset creation",
      "Video": "Editing and producing reels",
      "Audio": "Voiceovers & background music"
    };

    const finalTools = finalStackTools.map((t, idx) => ({
      tool_id: t.name,
      position: idx + 1,
      purpose: purposesMap[t.category] || "General purpose"
    }));

    return {
      name: `${data.userType} recommended stack`,
      description: `Tailored workflow recommendation built for your experience level (${data.experienceLevel}) and goals: ${data.goals.join(", ")}.`,
      goal: data.goals[0] || "Custom target",
      category: data.categories[0] || "General",
      difficulty_level: data.experienceLevel,
      tools: finalTools
    };
  });

// Seeding engine to load prebuilt starter stacks automatically
export const seedPrebuiltStacksFn = createServerFn({ method: "POST" })
  .handler(async () => {
    // Check if stacks already exist
    const countResult = await db.select({ count: sql`count(*)` }).from(stacks);
    const count = Number((countResult[0] as any).count);
    if (count > 0) {
      return { success: true, message: "Database already has stacks." };
    }

    const starterStacks = [
      {
        name: "Developer Stack",
        description: "Speed up your software delivery with visual React building, intelligent refactoring, database schemas, and edge servers.",
        goal: "Build web apps fast",
        category: "Coding",
        difficulty_level: "Intermediate",
        is_public: true,
        tools: [
          { tool_id: "Cursor", position: 1, purpose: "Coding & Refactoring" },
          { tool_id: "Claude", position: 2, purpose: "Architecture & Logic" },
          { tool_id: "Supabase", position: 3, purpose: "Database, Auth & Backend" },
          { tool_id: "GitHub Copilot", position: 4, purpose: "Inline Autocomplete" }
        ]
      },
      {
        name: "Content Creator Stack",
        description: "Engaging and rich video, image, research, and voice production workflow for multi-channel creators.",
        goal: "Engage audience with video & media",
        category: "Video",
        difficulty_level: "Beginner",
        is_public: true,
        tools: [
          { tool_id: "ChatGPT", position: 1, purpose: "Idea Generation & Scripting" },
          { tool_id: "Perplexity", position: 2, purpose: "Citing & Fact Verification" },
          { tool_id: "Midjourney", position: 3, purpose: "Thumbnail & Image Design" },
          { tool_id: "CapCut", position: 4, purpose: "Reel & Short Editing" }
        ]
      },
      {
        name: "Startup Founder Stack",
        description: "Launch MVPs and automations without writing hundreds of lines of boilerplate. Integrate payments and database easily.",
        goal: "Build & launch SaaS MVP",
        category: "AI App Builders",
        difficulty_level: "Intermediate",
        is_public: true,
        tools: [
          { tool_id: "ChatGPT", position: 1, purpose: "Pitch Decks & Strategy" },
          { tool_id: "Lovable", position: 2, purpose: "UI & Frontend App Builder" },
          { tool_id: "Supabase", position: 3, purpose: "Data Storage & Auth" },
          { tool_id: "Stripe", position: 4, purpose: "Subscription Payments" }
        ]
      },
      {
        name: "Student Stack",
        description: "Study and digest papers, organize notes, synthesize sources, and draft summaries in half the time.",
        goal: "Ace exams & research papers",
        category: "Research",
        difficulty_level: "Beginner",
        is_public: true,
        tools: [
          { tool_id: "ChatGPT", position: 1, purpose: "Summarize Textbooks" },
          { tool_id: "NotebookLM", position: 2, purpose: "Audio Summaries & Document Chat" },
          { tool_id: "Perplexity", position: 3, purpose: "Academic Literature Review" },
          { tool_id: "Notion", position: 4, purpose: "Knowledge Repository" }
        ]
      },
      {
        name: "Research Stack",
        description: "High-grade scientific and literature searching tools backed by citations and structured evaluations.",
        goal: "Systematic scientific discovery",
        category: "Research",
        difficulty_level: "Advanced",
        is_public: true,
        tools: [
          { tool_id: "Perplexity", position: 1, purpose: "General search and fast briefs" },
          { tool_id: "NotebookLM", position: 2, purpose: "Deep document understanding" },
          { tool_id: "Consensus", position: 3, purpose: "Finding peer-reviewed consensus" },
          { tool_id: "Elicit", position: 4, purpose: "Synthesize literature reviews" }
        ]
      },
      {
        name: "Marketing Stack",
        description: "Generate ad copy, build social banners, search market opportunities, and schedule automated publishing.",
        goal: "Drive high-converting leads",
        category: "Writing",
        difficulty_level: "Beginner",
        is_public: true,
        tools: [
          { tool_id: "ChatGPT", position: 1, purpose: "Copywriting & Ad Angles" },
          { tool_id: "Jasper", position: 2, purpose: "SEO Blog Generation" },
          { tool_id: "Canva", position: 3, purpose: "Graphics and Ad Creatives" },
          { tool_id: "n8n", position: 4, purpose: "Lead Sync & Auto-posting" }
        ]
      },
      {
        name: "Freelancer Stack",
        description: "Speed up client deliveries, manage invoice systems, automate routine communications, and build clean assets.",
        goal: "Deliver client projects fast",
        category: "Automation",
        difficulty_level: "Intermediate",
        is_public: true,
        tools: [
          { tool_id: "ChatGPT", position: 1, purpose: "Proposal & Client Writing" },
          { tool_id: "Cursor", position: 2, purpose: "Coding Client Products" },
          { tool_id: "n8n", position: 3, purpose: "Invoice/Reporting Pipeline" },
          { tool_id: "Stripe", position: 4, purpose: "Payment collection" }
        ]
      },
      {
        name: "Designer Stack",
        description: "Create premium graphics, generate high-fidelity UI layout files, edit templates, and build websites visually.",
        goal: "Build moodboards & site designs",
        category: "Image",
        difficulty_level: "Intermediate",
        is_public: true,
        tools: [
          { tool_id: "Midjourney", position: 1, purpose: "High-fidelity Concept Art" },
          { tool_id: "Stable Diffusion", position: 2, purpose: "Custom Asset Generation" },
          { tool_id: "Framer AI", position: 3, purpose: "Vibrant Interactive Prototypes" },
          { tool_id: "Figma", position: 4, purpose: "Design Handoff & Assets" }
        ]
      }
    ];

    for (const starter of starterStacks) {
      const id = starter.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      // Check if this prebuilt stack is already seeded
      const found = await db.select().from(stacks).where(eq(stacks.name, starter.name));
      if (found.length === 0) {
        await db.insert(stacks).values({
          id,
          user_id: null, // Global prebuilt stack
          name: starter.name,
          description: starter.description,
          goal: starter.goal,
          category: starter.category,
          difficulty_level: starter.difficulty_level,
          is_public: true,
          featured: true
        });

        for (const t of starter.tools) {
          await db.insert(stackTools).values({
            id: generateId(),
            stack_id: id,
            tool_id: t.tool_id,
            position: t.position,
            purpose: t.purpose
          });
        }
      }
    }

    return { success: true, message: "Prebuilt stacks successfully seeded." };
  });
