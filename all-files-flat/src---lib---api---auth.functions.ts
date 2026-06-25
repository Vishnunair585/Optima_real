import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";
import { users, userProfiles, emailVerificationTokens, emailNotifications } from "../db/schema";
import { eq, and, gte } from "drizzle-orm";
import { logSystemEvent } from "../monitoring/system-logger";
import { writeAuditLog } from "../monitoring/audit-logger";
import {
  detectBruteForce, detectSuspiciousLogin, detectRepeatedFailure
} from "../monitoring/security-monitor";
import { startMeasure, endMeasure } from "../monitoring/perf-monitor";
import { captureApiError } from "../monitoring/sentry.server";
const generateId = () => crypto.randomUUID();

async function getSession() {
  const { getCurrentSession } = await import("../../server/auth/session.server");
  return getCurrentSession();
}

async function rateLimit(key: string, limit: number, windowMs: number) {
  const { checkRateLimit } = await import("../../server/auth/rate-limit.server");
  return checkRateLimit(key, limit, windowMs);
}

async function hashPass(password: string) {
  const { hashPassword } = await import("../../server/auth/crypto.server");
  return hashPassword(password);
}

async function verifyPass(hash: string, password: string) {
  const { verifyPassword } = await import("../../server/auth/crypto.server");
  return verifyPassword(hash, password);
}

async function startSession(userId: string) {
  const { createSession } = await import("../../server/auth/session.server");
  return createSession(userId);
}

async function endSession(sessionId: string) {
  const { invalidateSession } = await import("../../server/auth/session.server");
  return invalidateSession(sessionId);
}

async function setCookie(sessionId: string, expiresAt: Date) {
  const { setSessionCookie } = await import("../../server/auth/session.server");
  return setSessionCookie(sessionId, expiresAt);
}

async function deleteCookie() {
  const { deleteSessionCookie } = await import("../../server/auth/session.server");
  return deleteSessionCookie();
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

async function getClientIp() {
  try {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    return getRequestHeader("x-forwarded-for") || "unknown";
  } catch {
    return "unknown";
  }
}

export const syncSupabaseSessionFn = createServerFn({ method: "POST" })
  .validator(z.object({
    userId: z.string(),
    email: z.string().email(),
    name: z.string(),
    avatar: z.string().nullable(),
    email_verified: z.boolean(),
  }))
  .handler(async ({ data }) => {
    const ip = await getClientIp();
    if (!await rateLimit(`sync:${data.userId}`, 60, 1000 * 60)) {
      throw new Error("Too many synchronization requests.");
    }

    const existing = await db.select().from(users).where(eq(users.id, data.userId));
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

    const sessionId = await startSession(data.userId);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await setCookie(sessionId, expiresAt);

    return { success: true, onboarded };
  });

export const signUpFn = createServerFn({ method: "POST" })
  .validator(z.object({
    email: z.string().email(),
    password: z.string().min(8),
    username: z.string().min(2),
    referralCode: z.string().optional(),
    fingerprint: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const ip = await getClientIp();
    if (!await rateLimit(`signup:${ip}`, 5, 1000 * 60 * 15)) {
      throw new Error("Too many attempts. Try again later.");
    }

    const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email));
    if (existingUser.length > 0) {
      throw new Error("An account with this email already exists. Try logging in instead.");
    }

    const id = generateId();
    const passwordHash = await hashPass(data.password);

    await db.insert(users).values({
      id,
      email: data.email,
      name: data.username,
      password_hash: passwordHash,
      email_verified: false,
    });

    const { ensureUserReferralCode, processReferralSignup } = await import("./referral.functions");
    await ensureUserReferralCode(id);

    if (data.referralCode) {
      await processReferralSignup(data.referralCode, id, ip, data.fingerprint);
    }

    // Create session
    const sessionId = await startSession(id);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await setCookie(sessionId, expiresAt);

    await logSystemEvent({
      event_type: "signup",
      severity: "info",
      user_id: id,
      description: `New user registered: ${data.email}`,
      metadata: { email: data.email, username: data.username, has_referral: !!data.referralCode },
      ip_address: ip,
    });

    await writeAuditLog({
      action: "admin.changed",
      entity_type: "user",
      entity_id: id,
      actor_id: id,
      changes: { user: { old: null, new: { email: data.email, username: data.username } } },
      ip_address: ip,
    });

    return { success: true, userId: id };
  });

export const loginFn = createServerFn({ method: "POST" })
  .validator(z.object({
    email: z.string().email(),
    password: z.string(),
  }))
  .handler(async ({ data }) => {
    startMeasure("loginFn");
    const ip = await getClientIp();

    // Security checks
    const bruteForce = await detectBruteForce(ip, data.email);
    if (bruteForce) {
      throw new Error("Account temporarily locked due to suspicious activity.");
    }

    if (!await rateLimit(`login:${data.email}`, 10, 1000 * 60 * 15)) {
      await logSystemEvent({
        event_type: "auth_error",
        severity: "warn",
        description: `Rate limited login for ${data.email} from IP ${ip}`,
        metadata: { email: data.email },
        ip_address: ip,
      });
      throw new Error("Too many login attempts. Please try again later.");
    }

    const result = await db.select().from(users).where(eq(users.email, data.email));
    if (result.length === 0) {
      await detectRepeatedFailure(data.email, ip);
      await logSystemEvent({
        event_type: "auth_error",
        severity: "info",
        description: `Failed login attempt for unknown email ${data.email} from IP ${ip}`,
        metadata: { email: data.email, reason: "user_not_found" },
        ip_address: ip,
      });
      endMeasure("loginFn");
      throw new Error("Invalid credentials.");
    }

    const user = result[0];
    const validPassword = await verifyPass(user.password_hash, data.password);
    if (!validPassword) {
      await detectRepeatedFailure(data.email, ip);
      await logSystemEvent({
        event_type: "auth_error",
        severity: "warn",
        description: `Failed login attempt for ${data.email} from IP ${ip} (wrong password)`,
        metadata: { email: data.email, user_id: user.id, reason: "wrong_password" },
        ip_address: ip,
      });
      endMeasure("loginFn");
      throw new Error("Invalid credentials.");
    }

    const sessionId = await startSession(user.id);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await setCookie(sessionId, expiresAt);

    await logSystemEvent({
      event_type: "login",
      severity: "info",
      user_id: user.id,
      description: `User ${data.email} logged in from IP ${ip}`,
      metadata: { email: data.email },
      ip_address: ip,
    });

    await detectSuspiciousLogin(ip, user.id);

    endMeasure("loginFn");
    return { success: true, userId: user.id };
  });

export const logoutFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const authData = await getSession();
    if (authData) {
      await endSession(authData.session.id);
    }
    await deleteCookie();
    return { success: true };
  });

export const getSessionFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const authData = await getSession();
    if (!authData) return null;

    const { isAdmin } = await import("../security/authz");
    const admin = await isAdmin(authData.user.id);

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.name,
        avatar: authData.user.avatar,
        email_verified: authData.user.email_verified,
        onboarded: authData.user.onboarded,
        role: admin ? "Admin" : "Member",
      }
    };
  });

export const updateAvatarFn = createServerFn({ method: "POST" })
  .validator(z.object({ avatar: z.string() }))
  .handler(async ({ data }) => {
    const authData = await getSession();
    if (!authData) {
      throw new Error("Unauthorized");
    }

    await db.update(users)
      .set({ avatar: data.avatar })
      .where(eq(users.id, authData.user.id));

    return { success: true };
  });

function generateOtp(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += (bytes[i]! % 10).toString();
  }
  return otp;
}

export const sendVerificationEmailFn = createServerFn({ method: "POST" })
  .validator(z.object({
    email: z.string(),
    userId: z.string(),
  }))
  .handler(async ({ data }) => {
    const tokenId = generateId();
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    let userId = data.userId;
    if (!userId) {
      const user = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
      if (user.length === 0) return { success: false, reason: "User not found" };
      userId = user[0].id;
    }

    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.user_id, userId));

    await db.insert(emailVerificationTokens).values({
      id: tokenId,
      user_id: userId,
      email: data.email,
      token: otp,
      expires_at: expiresAt,
    });

    // Send OTP via email
    const { sendEmail } = await import("../email/send-email");
    await sendEmail(
      data.email,
      "Your OTP code — Optima",
      `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
    );

    // Also queue for retry in background worker (if one exists)
    await db.insert(emailNotifications).values({
      id: generateId(),
      user_id: userId,
      email: data.email,
      type: "email_verification",
      subject: "Your OTP code — Optima",
      body: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
    });

    return { success: true };
  });

export const verifyEmailWithOtpFn = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email(), otp: z.string().length(6) }))
  .handler(async ({ data }) => {
    const ip = await getClientIp();
    if (!await rateLimit(`otp:${ip}`, 5, 1000 * 60)) {
      return { success: false, reason: "Too many OTP attempts. Please wait before trying again." };
    }
    if (!await rateLimit(`otp:${data.email}`, 10, 1000 * 60 * 5)) {
      return { success: false, reason: "Too many OTP attempts for this email. Please try again later." };
    }

    const now = new Date();

    const tokenRecord = await db.select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.email, data.email),
          eq(emailVerificationTokens.token, data.otp),
          gte(emailVerificationTokens.expires_at, now),
        ),
      )
      .limit(1);

    if (tokenRecord.length === 0) {
      return { success: false, reason: "Invalid or expired OTP." };
    }

    const record = tokenRecord[0];

    await db.update(users)
      .set({ email_verified: true, updated_at: now })
      .where(eq(users.id, record.user_id));

    // Log user in by creating a session
    const sessionId = await startSession(record.user_id);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await setCookie(sessionId, expiresAt);

    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, record.id));

    return { success: true };
  });

export const resendVerificationEmailFn = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string() }))
  .handler(async ({ data }) => {
    const user = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (user.length === 0) throw new Error("User not found.");
    if (user[0].email_verified) throw new Error("Email is already verified.");

    return sendVerificationEmailFn({ data: { email: data.email, userId: user[0].id } });
  });

// Password Reset
export const requestPasswordResetFn = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const ip = await getClientIp();
    if (!await rateLimit(`reset:${ip}`, 3, 1000 * 60 * 60)) {
      throw new Error("Too many requests.");
    }

    const user = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (user.length === 0) {
      // Don't reveal if email exists, return success regardless
      return { success: true };
    }

    const { passwordResetTokens } = await import("../db/schema");
    const tokenId = generateId();
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.user_id, user[0].id));
    await db.insert(passwordResetTokens).values({
      id: tokenId,
      user_id: user[0].id,
      token: resetToken,
      expires_at: expiresAt,
    });

    const origin = await getOrigin();
    const resetLink = `${origin}/reset-password?token=${resetToken}`;

    await db.insert(emailNotifications).values({
      id: generateId(),
      user_id: user[0].id,
      email: data.email,
      type: "password_reset",
      subject: "Reset your password — Optima",
      body: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can ignore this email.`,
    });

    return { success: true };
  });

export const resetPasswordFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), password: z.string().min(8) }))
  .handler(async ({ data }) => {
    const { passwordResetTokens } = await import("../db/schema");
    const tokenRecord = await db.select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, data.token))
      .limit(1);

    if (tokenRecord.length === 0) {
      throw new Error("Invalid or expired reset token.");
    }

    const record = tokenRecord[0];
    const now = new Date();

    if (record.expires_at < now) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, record.id));
      throw new Error("Reset token has expired. Please request a new one.");
    }

    const passwordHash = await hashPass(data.password);
    await db.update(users)
      .set({ password_hash: passwordHash, updated_at: now })
      .where(eq(users.id, record.user_id));

    // Clean up used token
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, record.id));

    return { success: true };
  });

export const verifyEmailManuallyFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const authData = await getSession();
    if (!authData) {
      throw new Error("Unauthorized");
    }

    await db.update(users)
      .set({ email_verified: true })
      .where(eq(users.id, authData.user.id));

    return { success: true };
  });

// OAuth URLs
export const getOAuthUrlFn = createServerFn({ method: "POST" })
  .validator(z.object({
    provider: z.string(),
    redirectTo: z.string(),
  }))
  .handler(async ({ data }) => {
    const origin = await getOrigin();

    // For each provider, return the OAuth URL.
    // When real API keys are configured in .env, these will redirect to the provider.
    // For now, we use the mock/simulated flow.

    const envKey = `OAUTH_${data.provider.toUpperCase()}_CLIENT_ID`;
    const clientId = process.env[envKey];

    if (!clientId) {
      // Mock mode: simulate successful OAuth by creating a session directly
      // This allows development/testing without real OAuth keys
      return { url: `${origin}/login?oauth=mock&provider=${data.provider}&redirect=${encodeURIComponent(data.redirectTo)}` };
    }

    const redirectUri = `${origin}/auth-callback?provider=${data.provider}`;

    const urls: Record<string, string> = {
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline`,
      github: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user%20user:email`,
      twitter: `https://twitter.com/i/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=tweet.read%20users.read&code_challenge=challenge&code_challenge_method=plain`,
    };

    return { url: urls[data.provider] || `${origin}/login?error=unsupported_provider` };
  });
