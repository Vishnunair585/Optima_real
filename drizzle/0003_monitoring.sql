CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `event_type` text NOT NULL,
  `severity` text NOT NULL DEFAULT 'info',
  `user_id` text REFERENCES `users`(`id`),
  `description` text NOT NULL,
  `metadata` text NOT NULL DEFAULT '{}',
  `ip_address` text,
  `user_agent` text,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `action` text NOT NULL,
  `entity_type` text NOT NULL,
  `entity_id` text NOT NULL,
  `actor_id` text REFERENCES `users`(`id`),
  `changes` text NOT NULL DEFAULT '{}',
  `ip_address` text,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS `security_events` (
  `id` text PRIMARY KEY NOT NULL,
  `event_type` text NOT NULL,
  `severity` text NOT NULL DEFAULT 'warn',
  `user_id` text REFERENCES `users`(`id`),
  `ip_address` text NOT NULL,
  `description` text NOT NULL,
  `metadata` text NOT NULL DEFAULT '{}',
  `resolved` integer DEFAULT false NOT NULL,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS `backup_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `backup_type` text NOT NULL,
  `status` text NOT NULL DEFAULT 'running',
  `file_path` text,
  `file_size_bytes` integer,
  `rows_backed_up` integer,
  `error_message` text,
  `started_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  `completed_at` integer
);

CREATE TABLE IF NOT EXISTS `alert_history` (
  `id` text PRIMARY KEY NOT NULL,
  `alert_type` text NOT NULL,
  `severity` text NOT NULL DEFAULT 'warn',
  `title` text NOT NULL,
  `description` text NOT NULL,
  `metadata` text NOT NULL DEFAULT '{}',
  `channels` text NOT NULL DEFAULT '[]',
  `delivered` integer DEFAULT false NOT NULL,
  `acknowledged_at` integer,
  `created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
