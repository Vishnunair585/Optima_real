CREATE TABLE IF NOT EXISTS `email_verification_tokens` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `email` text NOT NULL,
  `token` text NOT NULL UNIQUE,
  `expires_at` integer NOT NULL,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `email_verification_tokens_token_unique` ON `email_verification_tokens` (`token`);
