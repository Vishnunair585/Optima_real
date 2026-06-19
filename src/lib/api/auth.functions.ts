import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";
import { users, userProfiles } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateId, hashPassword, verifyPassword } from "../../server/auth/crypto.server";
import { checkRateLimit } from "../../server/auth/rate-limit.server";
import { createSession, invalidateSession, setSessionCookie, deleteSessionCookie, getCurrentSession } from "../../server/auth/session.server";
import { getRequestHeader } from "@tanstack/react-start/server";

export const syncSupabaseSessionFn = createServerFn({ method: "POST" })
  .validator(z.object({
    userId: z.string(),
    email: z.string().email(),
    name: z.string(),
    avatar: z.string().nullable(),
    email_verified: z.boolean(),
  }))
  .handler(async ({ data }) => {
    const ip = getRequestHeader("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`sync:${data.userId}`, 60, 1000 * 60)) {
      throw new Error("Too many synchronization requests.");
    }

    // Check if user exists in SQLite
    const existing = await db.select().from(users).where(eq(users.id, data.userId));
    
    // Check if onboarded profile exists
    const profile = await db.select().from(userProfiles).where(eq(userProfiles.user_id, data.userId));
    const onboarded = profile.length > 0;

    if (existing.length === 0) {
      await db.insert(users).values({
        id: data.userId,
        email: data.email,
        name: data.name,
        password_hash: "supabase_managed",
        avatar: data.avatar,
        email_verified: data.email_verified,
        onboarded: onboarded,
      });
    } else {
      await db.update(users).set({
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        email_verified: data.email_verified,
        onboarded: onboarded,
        updated_at: new Date(),
      }).where(eq(users.id, data.userId));
    }

    // Establish server-side SQLite session cookie
    const sessionId = await createSession(data.userId);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
    setSessionCookie(sessionId, expiresAt);

    return { success: true, onboarded };
  });


export const signUpFn = createServerFn({ method: "POST" })
  .validator(z.object({
    email: z.string().email(),
    password: z.string().min(8),
    username: z.string().min(2),
  }))
  .handler(async ({ data }) => {
    const ip = getRequestHeader("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`signup:${ip}`, 5, 1000 * 60 * 15)) {
      throw new Error("Too many attempts. Try again later.");
    }

    const existingUser = await db.select().from(users).where(eq(users.email, data.email));
    if (existingUser.length > 0) {
      throw new Error("Email already in use.");
    }

    const id = generateId();
    const passwordHash = await hashPassword(data.password);

    await db.insert(users).values({
      id,
      email: data.email,
      name: data.username,
      password_hash: passwordHash,
      email_verified: true,
    });

    // Create session
    const sessionId = await createSession(id);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    setSessionCookie(sessionId, expiresAt);

    return { success: true, userId: id };
  });

export const loginFn = createServerFn({ method: "POST" })
  .validator(z.object({
    email: z.string().email(),
    password: z.string(),
  }))
  .handler(async ({ data }) => {
    const ip = getRequestHeader("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`login:${data.email}`, 10, 1000 * 60 * 15)) {
      throw new Error("Too many login attempts. Please try again later.");
    }

    const result = await db.select().from(users).where(eq(users.email, data.email));
    if (result.length === 0) {
      throw new Error("Invalid credentials.");
    }

    const user = result[0];
    const validPassword = await verifyPassword(user.password_hash, data.password);
    if (!validPassword) {
      throw new Error("Invalid credentials.");
    }

    const sessionId = await createSession(user.id);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    setSessionCookie(sessionId, expiresAt);

    return { success: true, userId: user.id };
  });

export const logoutFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const authData = await getCurrentSession();
    if (authData) {
      await invalidateSession(authData.session.id);
    }
    deleteSessionCookie();
    return { success: true };
  });

export const getSessionFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getCurrentSession();
    if (!authData) return null;
    
    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.name,
        avatar: authData.user.avatar,
        email_verified: authData.user.email_verified,
        onboarded: authData.user.onboarded,
      }
    };
  });

export const updateAvatarFn = createServerFn({ method: "POST" })
  .validator(z.object({ avatar: z.string() }))
  .handler(async ({ data }) => {
    const authData = await getCurrentSession();
    if (!authData) {
      throw new Error("Unauthorized");
    }

    await db.update(users)
      .set({ avatar: data.avatar })
      .where(eq(users.id, authData.user.id));

    return { success: true };
  });

export const requestPasswordResetFn = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const ip = getRequestHeader("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`reset:${ip}`, 3, 1000 * 60 * 60)) {
      throw new Error("Too many requests.");
    }

    // Logic for generating token and storing it would go here
    // And sending the email. We will mock this to console for now.
    console.log(`[MOCK EMAIL] Password reset requested for ${data.email}.`);
    
    return { success: true };
  });

export const resetPasswordFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), password: z.string().min(8) }))
  .handler(async ({ data }) => {
    // Logic for verifying token and updating password
    console.log(`[MOCK] Reset password with token ${data.token}.`);
    return { success: true };
  });

export const verifyEmailManuallyFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const authData = await getCurrentSession();
    if (!authData) {
      throw new Error("Unauthorized");
    }

    await db.update(users)
      .set({ email_verified: true })
      .where(eq(users.id, authData.user.id));

    return { success: true };
  });
