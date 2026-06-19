import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";
import { users, userProfiles, userPreferences } from "../db/schema";
import { eq } from "drizzle-orm";
import { getCurrentSession } from "../../server/auth/session.server";
import { generateId } from "../../server/auth/crypto.server";

export const completeOnboardingFn = createServerFn({ method: "POST" })
  .validator(z.object({
    fullName: z.string().min(2),
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
    avatarUrl: z.string().optional(),
    userType: z.string(),
    experienceLevel: z.string(),
    goals: z.array(z.string()),
    favoriteTools: z.array(z.string()),
    categories: z.array(z.string()),
  }))
  .handler(async ({ data }) => {
    const authData = await getCurrentSession();
    if (!authData) {
      throw new Error("Unauthorized");
    }

    const userId = authData.user.id;

    // Check if username is already taken
    const existing = await db.select().from(userProfiles).where(eq(userProfiles.username, data.username));
    if (existing.length > 0) {
      throw new Error("Username is already taken.");
    }

    // Create user profile
    await db.insert(userProfiles).values({
      id: generateId(),
      user_id: userId,
      full_name: data.fullName,
      username: data.username,
      avatar_url: data.avatarUrl || null,
      user_type: data.userType,
      experience_level: data.experienceLevel,
    });

    // Create user preferences
    await db.insert(userPreferences).values({
      id: generateId(),
      user_id: userId,
      goals: JSON.stringify(data.goals),
      favorite_tools: JSON.stringify(data.favoriteTools),
      categories: JSON.stringify(data.categories),
    });

    // Update user's name, avatar, and onboarded status
    await db.update(users).set({
      name: data.fullName,
      avatar: data.avatarUrl || null,
      onboarded: true,
    }).where(eq(users.id, userId));

    return { success: true };
  });

export const checkUsernameFn = createServerFn({ method: "GET" })
  .validator(z.object({ username: z.string() }))
  .handler(async ({ data }) => {
    if (!data.username || data.username.length < 3) {
      return { available: false };
    }
    const existing = await db.select().from(userProfiles).where(eq(userProfiles.username, data.username));
    return { available: existing.length === 0 };
  });

export const getOnboardingStatusFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getCurrentSession();
    if (!authData) return { onboarded: false };
    return { onboarded: authData.user.onboarded };
  });

export const getUserProfileFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getCurrentSession();
    if (!authData) return null;

    const profiles = await db.select().from(userProfiles).where(eq(userProfiles.user_id, authData.user.id));
    const prefs = await db.select().from(userPreferences).where(eq(userPreferences.user_id, authData.user.id));

    if (profiles.length === 0) return null;

    return {
      profile: profiles[0],
      preferences: prefs.length > 0 ? {
        ...prefs[0],
        goals: JSON.parse(prefs[0].goals) as string[],
        favorite_tools: JSON.parse(prefs[0].favorite_tools) as string[],
        categories: JSON.parse(prefs[0].categories) as string[],
      } : null,
    };
  });
