const Database = require("better-sqlite3");
const { randomBytes, randomUUID } = require("crypto");

const db = new Database("sqlite.db");

db.exec(`
CREATE TABLE IF NOT EXISTS referral_codes (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS referrals (
  id text PRIMARY KEY NOT NULL,
  referrer_user_id text NOT NULL,
  referred_user_id text,
  referral_code text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  reward_granted integer DEFAULT 0 NOT NULL,
  revenue_cents integer DEFAULT 0 NOT NULL,
  ip_address text,
  fingerprint text,
  qualified_at integer,
  converted_at integer,
  created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE cascade,
  FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS referral_clicks (
  id text PRIMARY KEY NOT NULL,
  referral_code text NOT NULL,
  referrer_user_id text,
  ip_address text,
  user_agent text,
  session_id text,
  is_vpn_suspected integer DEFAULT 0 NOT NULL,
  converted integer DEFAULT 0 NOT NULL,
  created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS referral_reward_milestones (
  id text PRIMARY KEY NOT NULL,
  referral_count integer NOT NULL,
  reward_type text NOT NULL,
  reward_value integer NOT NULL,
  label text NOT NULL,
  description text,
  active integer DEFAULT 1 NOT NULL,
  created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS referral_rewards_granted (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL,
  milestone_id text,
  reward_type text NOT NULL,
  reward_value integer NOT NULL,
  granted_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade,
  FOREIGN KEY (milestone_id) REFERENCES referral_reward_milestones(id) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS user_badges (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL,
  badge_key text NOT NULL,
  earned_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS referral_fraud_alerts (
  id text PRIMARY KEY NOT NULL,
  user_id text,
  referral_id text,
  alert_type text NOT NULL,
  severity text NOT NULL,
  metadata text DEFAULT '{}' NOT NULL,
  resolved integer DEFAULT 0 NOT NULL,
  created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE set null,
  FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS referral_invites (
  id text PRIMARY KEY NOT NULL,
  referrer_user_id text NOT NULL,
  email text NOT NULL,
  status text DEFAULT 'sent' NOT NULL,
  created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
`);

const milestoneCount = db.prepare("SELECT COUNT(*) as c FROM referral_reward_milestones").get().c;
if (milestoneCount === 0) {
  const insert = db.prepare(`
    INSERT INTO referral_reward_milestones (id, referral_count, reward_type, reward_value, label, description, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  const milestones = [
    ["milestone-1", 1, "pro_extension_days", 7, "+7 Days Pro", "Extend your Pro subscription by 7 days"],
    ["milestone-3", 3, "pro_extension_days", 30, "+1 Month Pro", "Extend your Pro subscription by 1 month"],
    ["milestone-10", 10, "badge", 0, "Premium Badge", "Unlock the Premium Ambassador badge"],
    ["milestone-20", 20, "exclusive_features", 1, "Exclusive Features", "Unlock exclusive referral-only features"],
  ];
  for (const m of milestones) insert.run(...m);
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  const bytes = randomBytes(5);
  for (let i = 0; i < 5; i++) suffix += chars[bytes[i] % chars.length];
  return `AIRANK-${suffix}`;
}

const usersWithoutCode = db.prepare(`
  SELECT u.id FROM users u
  LEFT JOIN referral_codes rc ON rc.user_id = u.id
  WHERE rc.id IS NULL
`).all();

const insertCode = db.prepare(`
  INSERT INTO referral_codes (id, user_id, code) VALUES (?, ?, ?)
`);

for (const user of usersWithoutCode) {
  let code = generateCode();
  let attempts = 0;
  while (db.prepare("SELECT 1 FROM referral_codes WHERE code = ?").get(code) && attempts < 10) {
    code = generateCode();
    attempts++;
  }
  insertCode.run(randomUUID(), user.id, code);
}

console.log(`referral schema applied; backfilled ${usersWithoutCode.length} referral codes`);
