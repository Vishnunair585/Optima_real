import { db } from "../../lib/db";
import { sessions, users } from "../../lib/db/schema";
import { eq } from "drizzle-orm";
import { generateSessionToken } from "./crypto.server";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

const SESSION_COOKIE_NAME = "auth_session";

export async function createSession(userId: string): Promise<string> {
  const sessionId = generateSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
  
  await db.insert(sessions).values({
    id: sessionId,
    user_id: userId,
    expires_at: expiresAt,
  });
  
  return sessionId;
}

export async function validateSession(sessionId: string) {
  const result = await db.select({
    sessionId: sessions.id,
    sessionUserId: sessions.user_id,
    sessionCreatedAt: sessions.created_at,
    sessionExpiresAt: sessions.expires_at,
    sessionIp: sessions.ip_address,
    sessionDevice: sessions.device_info,
    userId: users.id,
    userName: users.name,
    userEmail: users.email,
    userAvatar: users.avatar,
    userEmailVerified: users.email_verified,
    userOnboarded: users.onboarded,
  })
  .from(sessions)
  .innerJoin(users, eq(sessions.user_id, users.id))
  .where(eq(sessions.id, sessionId));

  if (result.length === 0) {
    return null;
  }

  const row = result[0];
  const session = {
    id: row.sessionId,
    user_id: row.sessionUserId,
    created_at: row.sessionCreatedAt,
    expires_at: row.sessionExpiresAt,
    ip_address: row.sessionIp,
    device_info: row.sessionDevice,
  };
  const user = {
    id: row.userId,
    name: row.userName,
    email: row.userEmail,
    avatar: row.userAvatar,
    email_verified: row.userEmailVerified,
    onboarded: row.userOnboarded,
  };

  if (Date.now() >= session.expires_at.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return null;
  }

  // Extend session if less than 15 days left
  if (session.expires_at.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 15) {
    session.expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db.update(sessions).set({ expires_at: session.expires_at }).where(eq(sessions.id, session.id));
  }

  return { session, user };
}

export async function invalidateSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export function setSessionCookie(sessionId: string, expiresAt: Date) {
  setCookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export function deleteSessionCookie() {
  deleteCookie(SESSION_COOKIE_NAME, {
    path: "/",
  });
}

export async function getCurrentSession() {
  const sessionId = getCookie(SESSION_COOKIE_NAME);
  if (!sessionId) {
    return null;
  }
  const result = await validateSession(sessionId);
  if (!result) {
    deleteSessionCookie();
    return null;
  }
  return result;
}
