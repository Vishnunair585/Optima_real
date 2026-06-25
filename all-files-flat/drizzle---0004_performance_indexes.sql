-- Performance indexes for common query patterns across all tables

-- Users: lookup by created_at for leaderboards/analytics
CREATE INDEX IF NOT EXISTS `users_created_at_idx` ON `users` (`created_at`);
CREATE INDEX IF NOT EXISTS `users_email_verified_idx` ON `users` (`email_verified`);

-- Sessions: fast user session lookups + expiry cleanup
CREATE INDEX IF NOT EXISTS `sessions_user_id_idx` ON `sessions` (`user_id`);
CREATE INDEX IF NOT EXISTS `sessions_expires_at_idx` ON `sessions` (`expires_at`);

-- Stacks: most queried table — composite indexes for listing/leaderboard/filtering
CREATE INDEX IF NOT EXISTS `stacks_user_id_idx` ON `stacks` (`user_id`);
CREATE INDEX IF NOT EXISTS `stacks_category_idx` ON `stacks` (`category`);
CREATE INDEX IF NOT EXISTS `stacks_is_public_idx` ON `stacks` (`is_public`);
CREATE INDEX IF NOT EXISTS `stacks_featured_idx` ON `stacks` (`featured`);
CREATE INDEX IF NOT EXISTS `stacks_created_at_idx` ON `stacks` (`created_at`);
CREATE INDEX IF NOT EXISTS `stacks_likes_count_idx` ON `stacks` (`likes_count`);
CREATE INDEX IF NOT EXISTS `stacks_goal_idx` ON `stacks` (`goal`);
CREATE INDEX IF NOT EXISTS `stacks_difficulty_level_idx` ON `stacks` (`difficulty_level`);
-- Composite: public stacks sorted by likes (leaderboard query)
CREATE INDEX IF NOT EXISTS `stacks_public_likes_idx` ON `stacks` (`is_public`, `likes_count` DESC);
-- Composite: user stacks sorted by date
CREATE INDEX IF NOT EXISTS `stacks_user_created_idx` ON `stacks` (`user_id`, `created_at` DESC);

-- Stack tools: fast joins from stacks/to tools
CREATE INDEX IF NOT EXISTS `stack_tools_stack_id_idx` ON `stack_tools` (`stack_id`);
CREATE INDEX IF NOT EXISTS `stack_tools_tool_id_idx` ON `stack_tools` (`tool_id`);
CREATE INDEX IF NOT EXISTS `stack_tools_stack_position_idx` ON `stack_tools` (`stack_id`, `position`);

-- Stack likes: fast lookup + dedup prevention
CREATE UNIQUE INDEX IF NOT EXISTS `stack_likes_stack_user_unique` ON `stack_likes` (`stack_id`, `user_id`);
CREATE INDEX IF NOT EXISTS `stack_likes_user_id_idx` ON `stack_likes` (`user_id`);
CREATE INDEX IF NOT EXISTS `stack_likes_created_at_idx` ON `stack_likes` (`created_at`);

-- Stack bookmarks
CREATE UNIQUE INDEX IF NOT EXISTS `stack_bookmarks_stack_user_unique` ON `stack_bookmarks` (`stack_id`, `user_id`);
CREATE INDEX IF NOT EXISTS `stack_bookmarks_user_id_idx` ON `stack_bookmarks` (`user_id`);

-- Stack comments
CREATE INDEX IF NOT EXISTS `stack_comments_stack_id_idx` ON `stack_comments` (`stack_id`);
CREATE INDEX IF NOT EXISTS `stack_comments_user_id_idx` ON `stack_comments` (`user_id`);
CREATE INDEX IF NOT EXISTS `stack_comments_parent_id_idx` ON `stack_comments` (`parent_id`);

-- Tool comparisons
CREATE INDEX IF NOT EXISTS `tool_comparisons_user_id_idx` ON `tool_comparisons` (`user_id`);
CREATE INDEX IF NOT EXISTS `tool_comparisons_view_count_idx` ON `tool_comparisons` (`view_count` DESC);
CREATE INDEX IF NOT EXISTS `tool_comparisons_created_at_idx` ON `tool_comparisons` (`created_at` DESC);

-- Analytics events: heavy write/read table
CREATE INDEX IF NOT EXISTS `analytics_events_user_id_idx` ON `analytics_events` (`user_id`);
CREATE INDEX IF NOT EXISTS `analytics_events_event_name_idx` ON `analytics_events` (`event_name`);
CREATE INDEX IF NOT EXISTS `analytics_events_session_id_idx` ON `analytics_events` (`session_id`);
CREATE INDEX IF NOT EXISTS `analytics_events_created_at_idx` ON `analytics_events` (`created_at`);
CREATE INDEX IF NOT EXISTS `analytics_events_name_created_idx` ON `analytics_events` (`event_name`, `created_at` DESC);

-- User sessions: analytics lookups
CREATE INDEX IF NOT EXISTS `user_sessions_user_id_idx` ON `user_sessions` (`user_id`);
CREATE INDEX IF NOT EXISTS `user_sessions_session_start_idx` ON `user_sessions` (`session_start`);

-- Subscriptions
CREATE INDEX IF NOT EXISTS `subscriptions_user_id_idx` ON `subscriptions` (`user_id`);
CREATE INDEX IF NOT EXISTS `subscriptions_status_idx` ON `subscriptions` (`status`);
CREATE INDEX IF NOT EXISTS `subscriptions_stripe_customer_id_idx` ON `subscriptions` (`stripe_customer_id`);
CREATE INDEX IF NOT EXISTS `subscriptions_current_period_end_idx` ON `subscriptions` (`current_period_end`);

-- User usage
CREATE UNIQUE INDEX IF NOT EXISTS `user_usage_user_period_unique` ON `user_usage` (`user_id`, `period_start`);
CREATE INDEX IF NOT EXISTS `user_usage_period_end_idx` ON `user_usage` (`period_end`);

-- Usage events
CREATE INDEX IF NOT EXISTS `usage_events_user_id_idx` ON `usage_events` (`user_id`);
CREATE INDEX IF NOT EXISTS `usage_events_feature_idx` ON `usage_events` (`feature`);
CREATE INDEX IF NOT EXISTS `usage_events_plan_name_idx` ON `usage_events` (`plan_name`);
CREATE INDEX IF NOT EXISTS `usage_events_created_at_idx` ON `usage_events` (`created_at`);

-- Payment history
CREATE INDEX IF NOT EXISTS `payment_history_user_id_idx` ON `payment_history` (`user_id`);
CREATE INDEX IF NOT EXISTS `payment_history_status_idx` ON `payment_history` (`status`);
CREATE INDEX IF NOT EXISTS `payment_history_stripe_subscription_id_idx` ON `payment_history` (`stripe_subscription_id`);
CREATE INDEX IF NOT EXISTS `payment_history_created_at_idx` ON `payment_history` (`created_at`);

-- Billing events
CREATE INDEX IF NOT EXISTS `billing_events_user_id_idx` ON `billing_events` (`user_id`);
CREATE INDEX IF NOT EXISTS `billing_events_event_name_idx` ON `billing_events` (`event_name`);
CREATE INDEX IF NOT EXISTS `billing_events_created_at_idx` ON `billing_events` (`created_at`);

-- Email notifications: queue-like access pattern
CREATE INDEX IF NOT EXISTS `email_notifications_user_id_idx` ON `email_notifications` (`user_id`);
CREATE INDEX IF NOT EXISTS `email_notifications_status_idx` ON `email_notifications` (`status`);
CREATE INDEX IF NOT EXISTS `email_notifications_type_idx` ON `email_notifications` (`type`);
CREATE INDEX IF NOT EXISTS `email_notifications_created_at_idx` ON `email_notifications` (`created_at`);
CREATE INDEX IF NOT EXISTS `email_notifications_status_created_idx` ON `email_notifications` (`status`, `created_at`);

-- Referrals
CREATE INDEX IF NOT EXISTS `referrals_referrer_user_id_idx` ON `referrals` (`referrer_user_id`);
CREATE INDEX IF NOT EXISTS `referrals_referred_user_id_idx` ON `referrals` (`referred_user_id`);
CREATE INDEX IF NOT EXISTS `referrals_status_idx` ON `referrals` (`status`);
CREATE INDEX IF NOT EXISTS `referrals_created_at_idx` ON `referrals` (`created_at`);

-- Referral clicks
CREATE INDEX IF NOT EXISTS `referral_clicks_referral_code_idx` ON `referral_clicks` (`referral_code`);
CREATE INDEX IF NOT EXISTS `referral_clicks_referrer_user_id_idx` ON `referral_clicks` (`referrer_user_id`);
CREATE INDEX IF NOT EXISTS `referral_clicks_converted_idx` ON `referral_clicks` (`converted`);

-- Referral invites
CREATE INDEX IF NOT EXISTS `referral_invites_referrer_user_id_idx` ON `referral_invites` (`referrer_user_id`);
CREATE INDEX IF NOT EXISTS `referral_invites_email_status_idx` ON `referral_invites` (`email`, `status`);

-- Referral fraud alerts
CREATE INDEX IF NOT EXISTS `referral_fraud_alerts_user_id_idx` ON `referral_fraud_alerts` (`user_id`);
CREATE INDEX IF NOT EXISTS `referral_fraud_alerts_alert_type_idx` ON `referral_fraud_alerts` (`alert_type`);
CREATE INDEX IF NOT EXISTS `referral_fraud_alerts_resolved_idx` ON `referral_fraud_alerts` (`resolved`);

-- User badges
CREATE INDEX IF NOT EXISTS `user_badges_user_id_idx` ON `user_badges` (`user_id`);
CREATE INDEX IF NOT EXISTS `user_badges_badge_key_idx` ON `user_badges` (`badge_key`);

-- Team workspaces
CREATE INDEX IF NOT EXISTS `team_workspaces_owner_user_id_idx` ON `team_workspaces` (`owner_user_id`);

-- Team members
CREATE INDEX IF NOT EXISTS `team_members_workspace_id_idx` ON `team_members` (`workspace_id`);
CREATE INDEX IF NOT EXISTS `team_members_user_id_idx` ON `team_members` (`user_id`);
CREATE INDEX IF NOT EXISTS `team_members_status_idx` ON `team_members` (`status`);

-- Coupons
CREATE INDEX IF NOT EXISTS `coupons_active_idx` ON `coupons` (`active`);
CREATE INDEX IF NOT EXISTS `coupons_expires_at_idx` ON `coupons` (`expires_at`);

-- Password reset tokens
CREATE INDEX IF NOT EXISTS `password_reset_tokens_user_id_idx` ON `password_reset_tokens` (`user_id`);
CREATE INDEX IF NOT EXISTS `password_reset_tokens_expires_at_idx` ON `password_reset_tokens` (`expires_at`);

-- Email verification tokens
CREATE INDEX IF NOT EXISTS `email_verification_tokens_user_id_idx` ON `email_verification_tokens` (`user_id`);
CREATE INDEX IF NOT EXISTS `email_verification_tokens_expires_at_idx` ON `email_verification_tokens` (`expires_at`);

-- System logs (monitoring)
CREATE INDEX IF NOT EXISTS `system_logs_event_type_idx` ON `system_logs` (`event_type`);
CREATE INDEX IF NOT EXISTS `system_logs_severity_idx` ON `system_logs` (`severity`);
CREATE INDEX IF NOT EXISTS `system_logs_user_id_idx` ON `system_logs` (`user_id`);
CREATE INDEX IF NOT EXISTS `system_logs_created_at_idx` ON `system_logs` (`created_at`);
CREATE INDEX IF NOT EXISTS `system_logs_type_severity_created_idx` ON `system_logs` (`event_type`, `severity`, `created_at` DESC);

-- Audit logs (monitoring)
CREATE INDEX IF NOT EXISTS `audit_logs_action_idx` ON `audit_logs` (`action`);
CREATE INDEX IF NOT EXISTS `audit_logs_entity_type_idx` ON `audit_logs` (`entity_type`);
CREATE INDEX IF NOT EXISTS `audit_logs_entity_id_idx` ON `audit_logs` (`entity_id`);
CREATE INDEX IF NOT EXISTS `audit_logs_actor_id_idx` ON `audit_logs` (`actor_id`);
CREATE INDEX IF NOT EXISTS `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);
CREATE INDEX IF NOT EXISTS `audit_logs_action_created_idx` ON `audit_logs` (`action`, `created_at` DESC);

-- Security events (monitoring)
CREATE INDEX IF NOT EXISTS `security_events_event_type_idx` ON `security_events` (`event_type`);
CREATE INDEX IF NOT EXISTS `security_events_severity_idx` ON `security_events` (`severity`);
CREATE INDEX IF NOT EXISTS `security_events_user_id_idx` ON `security_events` (`user_id`);
CREATE INDEX IF NOT EXISTS `security_events_ip_address_idx` ON `security_events` (`ip_address`);
CREATE INDEX IF NOT EXISTS `security_events_resolved_idx` ON `security_events` (`resolved`);
CREATE INDEX IF NOT EXISTS `security_events_created_at_idx` ON `security_events` (`created_at`);
CREATE INDEX IF NOT EXISTS `security_events_type_resolved_created_idx` ON `security_events` (`event_type`, `resolved`, `created_at` DESC);

-- Backup logs (monitoring)
CREATE INDEX IF NOT EXISTS `backup_logs_backup_type_idx` ON `backup_logs` (`backup_type`);
CREATE INDEX IF NOT EXISTS `backup_logs_status_idx` ON `backup_logs` (`status`);
CREATE INDEX IF NOT EXISTS `backup_logs_created_at_idx` ON `backup_logs` (`started_at` DESC);

-- Alert history (monitoring)
CREATE INDEX IF NOT EXISTS `alert_history_alert_type_idx` ON `alert_history` (`alert_type`);
CREATE INDEX IF NOT EXISTS `alert_history_severity_idx` ON `alert_history` (`severity`);
CREATE INDEX IF NOT EXISTS `alert_history_delivered_idx` ON `alert_history` (`delivered`);
CREATE INDEX IF NOT EXISTS `alert_history_created_at_idx` ON `alert_history` (`created_at` DESC);
