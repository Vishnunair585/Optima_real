const Database = require("better-sqlite3");

const db = new Database("sqlite.db");
const cols = db.prepare("pragma table_info(user_usage)").all().map((column) => column.name);
const addColumn = (name, sql) => {
  if (!cols.includes(name)) db.exec(sql);
};

addColumn("period_start", "ALTER TABLE user_usage ADD COLUMN period_start integer DEFAULT 0 NOT NULL");
addColumn("period_end", "ALTER TABLE user_usage ADD COLUMN period_end integer DEFAULT 0 NOT NULL");
addColumn("saved_tools_count", "ALTER TABLE user_usage ADD COLUMN saved_tools_count integer DEFAULT 0 NOT NULL");
addColumn("premium_feature_count", "ALTER TABLE user_usage ADD COLUMN premium_feature_count integer DEFAULT 0 NOT NULL");
addColumn("updated_at", "ALTER TABLE user_usage ADD COLUMN updated_at integer DEFAULT 0 NOT NULL");

db.exec(`
CREATE TABLE IF NOT EXISTS usage_events (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL,
  feature text NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  plan_name text NOT NULL,
  metadata text DEFAULT '{}' NOT NULL,
  created_at integer DEFAULT 0 NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS payment_history (
  id text PRIMARY KEY NOT NULL,
  user_id text,
  stripe_invoice_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  amount_paid integer DEFAULT 0 NOT NULL,
  currency text DEFAULT 'usd' NOT NULL,
  status text NOT NULL,
  hosted_invoice_url text,
  invoice_pdf text,
  paid_at integer,
  created_at integer DEFAULT 0 NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS billing_events (
  id text PRIMARY KEY NOT NULL,
  user_id text,
  event_name text NOT NULL,
  stripe_event_id text UNIQUE,
  metadata text DEFAULT '{}' NOT NULL,
  created_at integer DEFAULT 0 NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS coupons (
  id text PRIMARY KEY NOT NULL,
  code text NOT NULL UNIQUE,
  stripe_coupon_id text,
  stripe_promotion_code_id text,
  discount_type text NOT NULL,
  discount_value integer NOT NULL,
  active integer DEFAULT true NOT NULL,
  max_redemptions integer,
  redeemed_count integer DEFAULT 0 NOT NULL,
  expires_at integer,
  created_at integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS team_workspaces (
  id text PRIMARY KEY NOT NULL,
  owner_user_id text NOT NULL,
  subscription_id text,
  name text NOT NULL,
  seats_purchased integer DEFAULT 1 NOT NULL,
  created_at integer DEFAULT 0 NOT NULL,
  updated_at integer DEFAULT 0 NOT NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE cascade,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS team_members (
  id text PRIMARY KEY NOT NULL,
  workspace_id text NOT NULL,
  user_id text,
  email text NOT NULL,
  role text DEFAULT 'member' NOT NULL,
  status text DEFAULT 'invited' NOT NULL,
  invited_at integer DEFAULT 0 NOT NULL,
  joined_at integer,
  FOREIGN KEY (workspace_id) REFERENCES team_workspaces(id) ON DELETE cascade,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS email_notifications (
  id text PRIMARY KEY NOT NULL,
  user_id text,
  email text NOT NULL,
  type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text DEFAULT 'queued' NOT NULL,
  created_at integer DEFAULT 0 NOT NULL,
  sent_at integer,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE set null
);
`);

console.log("billing schema applied");
