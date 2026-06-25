ALTER TABLE `user_usage` ADD `period_start` integer DEFAULT (strftime('%s', 'now')) NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_usage` ADD `period_end` integer DEFAULT (strftime('%s', 'now', '+1 month')) NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_usage` ADD `saved_tools_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_usage` ADD `premium_feature_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_usage` ADD `updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `usage_events` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `feature` text NOT NULL,
  `quantity` integer DEFAULT 1 NOT NULL,
  `plan_name` text NOT NULL,
  `metadata` text DEFAULT '{}' NOT NULL,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `payment_history` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text,
  `stripe_invoice_id` text,
  `stripe_payment_intent_id` text,
  `stripe_subscription_id` text,
  `amount_paid` integer DEFAULT 0 NOT NULL,
  `currency` text DEFAULT 'usd' NOT NULL,
  `status` text NOT NULL,
  `hosted_invoice_url` text,
  `invoice_pdf` text,
  `paid_at` integer,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `payment_history_stripe_invoice_id_unique` ON `payment_history` (`stripe_invoice_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `billing_events` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text,
  `event_name` text NOT NULL,
  `stripe_event_id` text,
  `metadata` text DEFAULT '{}' NOT NULL,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `billing_events_stripe_event_id_unique` ON `billing_events` (`stripe_event_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` text PRIMARY KEY NOT NULL,
  `code` text NOT NULL,
  `stripe_coupon_id` text,
  `stripe_promotion_code_id` text,
  `discount_type` text NOT NULL,
  `discount_value` integer NOT NULL,
  `active` integer DEFAULT true NOT NULL,
  `max_redemptions` integer,
  `redeemed_count` integer DEFAULT 0 NOT NULL,
  `expires_at` integer,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `coupons_code_unique` ON `coupons` (`code`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `team_workspaces` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_user_id` text NOT NULL,
  `subscription_id` text,
  `name` text NOT NULL,
  `seats_purchased` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  `updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` text PRIMARY KEY NOT NULL,
  `workspace_id` text NOT NULL,
  `user_id` text,
  `email` text NOT NULL,
  `role` text DEFAULT 'member' NOT NULL,
  `status` text DEFAULT 'invited' NOT NULL,
  `invited_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  `joined_at` integer,
  FOREIGN KEY (`workspace_id`) REFERENCES `team_workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `email_notifications` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text,
  `email` text NOT NULL,
  `type` text NOT NULL,
  `subject` text NOT NULL,
  `body` text NOT NULL,
  `status` text DEFAULT 'queued' NOT NULL,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  `sent_at` integer,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
