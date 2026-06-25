import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAILS = new Set([
  "admin@airank.com",
  ...(process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) || []),
]);

const ADMIN_USER_IDS = new Set(
  process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || [],
);

export async function isAdmin(userId: string): Promise<boolean> {
  if (ADMIN_USER_IDS.has(userId)) return true;

  const result = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  if (result.length === 0) return false;

  const { email } = result[0];
  return ADMIN_EMAILS.has(email.toLowerCase());
}

export function requireAdmin(userId: string | undefined): asserts userId is string {
  if (!userId) throw new Error("Authentication required.");
}

export async function requireAdminAccess(userId: string): Promise<void> {
  requireAdmin(userId);
  const admin = await isAdmin(userId);
  if (!admin) throw new Error("Admin privileges required.");
}

export async function getRequestContext() {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const forwardedFor = getRequestHeader("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || getRequestHeader("x-real-ip") || "unknown";
  const userAgent = getRequestHeader("user-agent") || "unknown";
  const origin = getRequestHeader("origin") || "";
  const referer = getRequestHeader("referer") || "";
  return { ip, userAgent, origin, referer };
}
