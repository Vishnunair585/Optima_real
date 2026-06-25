import { z } from "zod";

const MAX_STRING_LENGTH = 5000;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_URL_LENGTH = 2048;

const urlOrEmpty = z.string().max(MAX_URL_LENGTH).url().optional().or(z.literal("").optional());

export const sanitizeString = (val: string): string =>
  val
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();

const sanitizedString = (maxLen: number) =>
  z
    .string()
    .max(maxLen)
    .transform((v) => sanitizeString(v));

export const authSchemas = {
  login: z.object({
    email: z.string().max(MAX_EMAIL_LENGTH).email().transform((v) => v.toLowerCase().trim()),
    password: z.string().min(8).max(128),
  }),

  signup: z.object({
    name: sanitizedString(MAX_NAME_LENGTH).min(2),
    email: z.string().max(MAX_EMAIL_LENGTH).email().transform((v) => v.toLowerCase().trim()),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and a number"),
    confirmPassword: z.string(),
  }).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),

  passwordReset: z.object({
    email: z.string().max(MAX_EMAIL_LENGTH).email().transform((v) => v.toLowerCase().trim()),
  }),

  passwordUpdate: z.object({
    token: z.string().min(1).max(1024),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and a number"),
  }),

  verifyEmail: z.object({
    email: z.string().max(MAX_EMAIL_LENGTH).email().transform((v) => v.toLowerCase().trim()),
    code: z.string().length(6).regex(/^\d{6}$/),
  }),

  resendVerification: z.object({
    email: z.string().max(MAX_EMAIL_LENGTH).email().transform((v) => v.toLowerCase().trim()),
  }),
};

export const profileSchemas = {
  update: z.object({
    fullName: sanitizedString(MAX_NAME_LENGTH).min(2).optional(),
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, underscores")
      .optional(),
    avatarUrl: urlOrEmpty,
    userType: z.enum(["student", "developer", "founder", "designer", "other"]).optional(),
    experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  }),
};

export const stackSchemas = {
  create: z.object({
    name: sanitizedString(100).min(2),
    description: sanitizedString(2000).min(10),
    goal: sanitizedString(500).min(5),
    category: z.string().min(2).max(50),
    difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]),
    isPublic: z.boolean().default(true),
    tools: z
      .array(
        z.object({
          toolId: sanitizedString(100).min(1),
          position: z.number().int().min(0),
          purpose: sanitizedString(500).min(2),
        }),
      )
      .min(1)
      .max(50),
  }),

  update: z.object({
    name: sanitizedString(100).min(2).optional(),
    description: sanitizedString(2000).min(10).optional(),
    goal: sanitizedString(500).min(5).optional(),
    category: z.string().min(2).max(50).optional(),
    difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    isPublic: z.boolean().optional(),
  }),
};

export const comparisonSchemas = {
  create: z.object({
    comparisonName: sanitizedString(200).min(2),
    toolIds: z.array(sanitizedString(100).min(1)).min(2).max(10),
  }),
};

export const generalSchemas = {
  email: z.string().max(MAX_EMAIL_LENGTH).email().transform((v) => v.toLowerCase().trim()),
  id: z.string().uuid(),
  pagination: z.object({
    cursor: z.string().max(500).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    direction: z.enum(["before", "after"]).default("after"),
  }),
};

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new Error(firstError?.message || "Validation failed");
  }
  return result.data;
}

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.errors.map((e) => e.message).join("; ") };
  }
  return { success: true, data: result.data };
}

export const sqlInjectionPattern = /['";\\]|(--)|(\/\*)|(\*\/)|(UNION\s+SELECT)|(DROP\s+TABLE)|(DELETE\s+FROM)|(INSERT\s+INTO)|(UPDATE\s+.*SET)/i;

export function detectSqlInjection(input: string): boolean {
  return sqlInjectionPattern.test(input);
}
