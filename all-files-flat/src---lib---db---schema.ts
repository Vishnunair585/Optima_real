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
  period_start: integer("period_start", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  period_end: integer("period_end", { mode: "timestamp" }).notNull(),
  comparisons_count: integer("comparisons_count").default(0).notNull(),
  stacks_count: integer("stacks_count").default(0).notNull(),
  saved_tools_count: integer("saved_tools_count").default(0).notNull(),
  premium_feature_count: integer("premium_feature_count").default(0).notNull(),
  reset_at: integer("reset_at", { mode: "timestamp" }).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const usageEvents = sqliteTable("usage_events", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  feature: text("feature").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  plan_name: text("plan_name").notNull(),
  metadata: text("metadata").default("{}").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const paymentHistory = sqliteTable("payment_history", {
  id: text("id").primaryKey(),
  user_id: text("user_id").references(() => users.id, { onDelete: "set null" }),
  stripe_invoice_id: text("stripe_invoice_id").unique(),
  stripe_payment_intent_id: text("stripe_payment_intent_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
  amount_paid: integer("amount_paid").default(0).notNull(),
  currency: text("currency").default("usd").notNull(),
  status: text("status").notNull(),
  hosted_invoice_url: text("hosted_invoice_url"),
  invoice_pdf: text("invoice_pdf"),
  paid_at: integer("paid_at", { mode: "timestamp" }),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const billingEvents = sqliteTable("billing_events", {
  id: text("id").primaryKey(),
  user_id: text("user_id").references(() => users.id, { onDelete: "set null" }),
  event_name: text("event_name").notNull(),
  stripe_event_id: text("stripe_event_id").unique(),
  metadata: text("metadata").default("{}").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const coupons = sqliteTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  stripe_coupon_id: text("stripe_coupon_id"),
  stripe_promotion_code_id: text("stripe_promotion_code_id"),
  discount_type: text("discount_type").notNull(), // percent, amount, referral
  discount_value: integer("discount_value").notNull(),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  max_redemptions: integer("max_redemptions"),
  redeemed_count: integer("redeemed_count").default(0).notNull(),
  expires_at: integer("expires_at", { mode: "timestamp" }),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const teamWorkspaces = sqliteTable("team_workspaces", {
  id: text("id").primaryKey(),
  owner_user_id: text("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscription_id: text("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  seats_purchased: integer("seats_purchased").default(1).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id").notNull().references(() => teamWorkspaces.id, { onDelete: "cascade" }),
  user_id: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  role: text("role").default("member").notNull(), // owner, admin, member
  status: text("status").default("invited").notNull(), // invited, active, removed
  invited_at: integer("invited_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  joined_at: integer("joined_at", { mode: "timestamp" }),
});

export const emailNotifications = sqliteTable("email_notifications", {
  id: text("id").primaryKey(),
  user_id: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  type: text("type").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").default("queued").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  sent_at: integer("sent_at", { mode: "timestamp" }),
});

export const referralCodes = sqliteTable("referral_codes", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  code: text("code").notNull().unique(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const referrals = sqliteTable("referrals", {
  id: text("id").primaryKey(),
  referrer_user_id: text("referrer_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referred_user_id: text("referred_user_id").references(() => users.id, { onDelete: "set null" }),
  referral_code: text("referral_code").notNull(),
  status: text("status").default("pending").notNull(),
  reward_granted: integer("reward_granted", { mode: "boolean" }).default(false).notNull(),
  revenue_cents: integer("revenue_cents").default(0).notNull(),
  ip_address: text("ip_address"),
  fingerprint: text("fingerprint"),
  qualified_at: integer("qualified_at", { mode: "timestamp" }),
  converted_at: integer("converted_at", { mode: "timestamp" }),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const referralClicks = sqliteTable("referral_clicks", {
  id: text("id").primaryKey(),
  referral_code: text("referral_code").notNull(),
  referrer_user_id: text("referrer_user_id").references(() => users.id, { onDelete: "set null" }),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  session_id: text("session_id"),
  is_vpn_suspected: integer("is_vpn_suspected", { mode: "boolean" }).default(false).notNull(),
  converted: integer("converted", { mode: "boolean" }).default(false).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const referralRewardMilestones = sqliteTable("referral_reward_milestones", {
  id: text("id").primaryKey(),
  referral_count: integer("referral_count").notNull(),
  reward_type: text("reward_type").notNull(),
  reward_value: integer("reward_value").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const referralRewardsGranted = sqliteTable("referral_rewards_granted", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  milestone_id: text("milestone_id").references(() => referralRewardMilestones.id, { onDelete: "set null" }),
  reward_type: text("reward_type").notNull(),
  reward_value: integer("reward_value").notNull(),
  granted_at: integer("granted_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const userBadges = sqliteTable("user_badges", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badge_key: text("badge_key").notNull(),
  earned_at: integer("earned_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const referralFraudAlerts = sqliteTable("referral_fraud_alerts", {
  id: text("id").primaryKey(),
  user_id: text("user_id").references(() => users.id, { onDelete: "set null" }),
  referral_id: text("referral_id").references(() => referrals.id, { onDelete: "set null" }),
  alert_type: text("alert_type").notNull(),
  severity: text("severity").notNull(),
  metadata: text("metadata").default("{}").notNull(),
  resolved: integer("resolved", { mode: "boolean" }).default(false).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const emailVerificationTokens = sqliteTable("email_verification_tokens", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expires_at: integer("expires_at", { mode: "timestamp" }).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const referralInvites = sqliteTable("referral_invites", {
  id: text("id").primaryKey(),
  referrer_user_id: text("referrer_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  status: text("status").default("sent").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// ─── Monitoring & Observability Tables ────────────────────────────────

export const systemLogs = sqliteTable("system_logs", {
  id: text("id").primaryKey(),
  event_type: text("event_type").notNull(), // login, signup, oauth, admin_action, db_operation, subscription, security
  severity: text("severity").notNull().default("info"), // debug, info, warn, error, critical
  user_id: text("user_id").references(() => users.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  metadata: text("metadata").default("{}").notNull(), // JSON
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(), // tool.created, tool.updated, tool.deleted, user.role_changed, subscription.changed, admin.changed
  entity_type: text("entity_type").notNull(), // tool, user, subscription, comparison, stack
  entity_id: text("entity_id").notNull(),
  actor_id: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  changes: text("changes").default("{}").notNull(), // JSON diff
  ip_address: text("ip_address"),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const securityEvents = sqliteTable("security_events", {
  id: text("id").primaryKey(),
  event_type: text("event_type").notNull(), // brute_force, suspicious_login, repeated_failure, unauthorized_access
  severity: text("severity").notNull().default("warn"), // warn, critical
  user_id: text("user_id").references(() => users.id, { onDelete: "set null" }),
  ip_address: text("ip_address").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata").default("{}").notNull(), // JSON
  resolved: integer("resolved", { mode: "boolean" }).default(false).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const backupLogs = sqliteTable("backup_logs", {
  id: text("id").primaryKey(),
  backup_type: text("backup_type").notNull(), // daily, weekly, monthly
  status: text("status").notNull().default("running"), // running, completed, failed
  file_path: text("file_path"),
  file_size_bytes: integer("file_size_bytes"),
  rows_backed_up: integer("rows_backed_up"),
  error_message: text("error_message"),
  started_at: integer("started_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  completed_at: integer("completed_at", { mode: "timestamp" }),
});

export const alertHistory = sqliteTable("alert_history", {
  id: text("id").primaryKey(),
  alert_type: text("alert_type").notNull(), // downtime, error_spike, traffic_spike, security_incident, stripe_failure
  severity: text("severity").notNull().default("warn"), // info, warn, critical
  title: text("title").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata").default("{}").notNull(), // JSON
  channels: text("channels").default("[]").notNull(), // JSON array ["email","slack","discord"]
  delivered: integer("delivered", { mode: "boolean" }).default(false).notNull(),
  acknowledged_at: integer("acknowledged_at", { mode: "timestamp" }),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

