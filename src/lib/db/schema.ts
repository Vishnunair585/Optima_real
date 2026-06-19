import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  avatar: text("avatar"),
  email_verified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  onboarded: integer("onboarded", { mode: "boolean" }).default(false).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  expires_at: integer("expires_at", { mode: "timestamp" }).notNull(),
  ip_address: text("ip_address"),
  device_info: text("device_info"),
});

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expires_at: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const userProfiles = sqliteTable("user_profiles", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  full_name: text("full_name").notNull(),
  username: text("username").notNull().unique(),
  avatar_url: text("avatar_url"),
  user_type: text("user_type").notNull(), // Student, Developer, Founder, etc.
  experience_level: text("experience_level").notNull(), // Beginner, Intermediate, Advanced
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const userPreferences = sqliteTable("user_preferences", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  goals: text("goals").notNull(), // JSON array
  favorite_tools: text("favorite_tools").notNull(), // JSON array
  categories: text("categories").notNull(), // JSON array
});

export const toolComparisons = sqliteTable("tool_comparisons", {
  id: text("id").primaryKey(),
  user_id: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  comparison_name: text("comparison_name").notNull(),
  tool_ids: text("tool_ids").notNull(), // JSON array of tool names
  slug: text("slug").notNull().unique(), // e.g. "chatgpt-vs-claude-vs-gemini"
  view_count: integer("view_count").default(0).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const stacks = sqliteTable("stacks", {
  id: text("id").primaryKey(), // UUID
  user_id: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  goal: text("goal").notNull(),
  category: text("category").notNull(),
  difficulty_level: text("difficulty_level").notNull(), // Beginner, Intermediate, Advanced
  is_public: integer("is_public", { mode: "boolean" }).default(true).notNull(),
  likes_count: integer("likes_count").default(0).notNull(),
  views_count: integer("views_count").default(0).notNull(),
  featured: integer("featured", { mode: "boolean" }).default(false).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const stackTools = sqliteTable("stack_tools", {
  id: text("id").primaryKey(), // UUID
  stack_id: text("stack_id").notNull().references(() => stacks.id, { onDelete: "cascade" }),
  tool_id: text("tool_id").notNull(), // Tool name or identifier
  position: integer("position").notNull(), // Sequence order
  purpose: text("purpose").notNull(), // Custom purpose defined by user
});

export const stackLikes = sqliteTable("stack_likes", {
  id: text("id").primaryKey(),
  stack_id: text("stack_id").notNull().references(() => stacks.id, { onDelete: "cascade" }),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const stackBookmarks = sqliteTable("stack_bookmarks", {
  id: text("id").primaryKey(),
  stack_id: text("stack_id").notNull().references(() => stacks.id, { onDelete: "cascade" }),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const stackComments = sqliteTable("stack_comments", {
  id: text("id").primaryKey(),
  stack_id: text("stack_id").notNull().references(() => stacks.id, { onDelete: "cascade" }),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parent_id: text("parent_id"), // references stack_comments.id for nested replies
  content: text("content").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id").primaryKey(), // UUID
  user_id: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  event_name: text("event_name").notNull(),
  page_url: text("page_url").notNull(),
  session_id: text("session_id").notNull(),
  metadata: text("metadata").notNull(), // JSON string representation
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const userSessions = sqliteTable("user_sessions", {
  id: text("id").primaryKey(), // Session ID UUID
  user_id: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  session_start: integer("session_start", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  session_end: integer("session_end", { mode: "timestamp" }),
  device: text("device").notNull(),
  browser: text("browser").notNull(),
  country: text("country").notNull(),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(), // UUID
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripe_customer_id: text("stripe_customer_id").notNull(),
  stripe_subscription_id: text("stripe_subscription_id"),
  plan_name: text("plan_name").default("Free").notNull(), // Free, Pro, Team
  status: text("status").default("active").notNull(), // active, trialing, past_due, canceled
  billing_cycle: text("billing_cycle").default("monthly").notNull(), // monthly, yearly
  current_period_start: integer("current_period_start", { mode: "timestamp" }).notNull(),
  current_period_end: integer("current_period_end", { mode: "timestamp" }).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const userUsage = sqliteTable("user_usage", {
  id: text("id").primaryKey(), // UUID
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  comparisons_count: integer("comparisons_count").default(0).notNull(),
  stacks_count: integer("stacks_count").default(0).notNull(),
  reset_at: integer("reset_at", { mode: "timestamp" }).notNull(),
});


