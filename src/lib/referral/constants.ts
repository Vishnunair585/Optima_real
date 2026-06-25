export const REFERRAL_COOKIE = "airank_ref";
export const REFERRAL_COOKIE_DAYS = 30;

export const BADGE_DEFINITIONS = {
  early_ambassador: { label: "Early Ambassador", description: "Joined the referral program early", icon: "🌟" },
  growth_champion: { label: "Growth Champion", description: "Referred 5+ qualified users", icon: "🚀" },
  community_builder: { label: "Community Builder", description: "Referred 10+ qualified users", icon: "🏗️" },
  top_referrer: { label: "Top Referrer", description: "Ranked in the top 10 referrers", icon: "👑" },
  premium_badge: { label: "Premium Ambassador", description: "Earned through 10 referral milestone", icon: "💎" },
} as const;

export type BadgeKey = keyof typeof BADGE_DEFINITIONS;

export const QUALIFIED_STATUSES = ["qualified", "converted"] as const;
export const SUCCESSFUL_STATUSES = ["signed_up", "qualified", "converted"] as const;

export function getReferralLink(code: string, origin?: string) {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "https://airrank.com");
  return `${base}/ref/${encodeURIComponent(code)}`;
}

export function storeReferralCode(code: string) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + REFERRAL_COOKIE_DAYS * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${REFERRAL_COOKIE}=${encodeURIComponent(code)}; path=/; expires=${expires}; SameSite=Lax`;
  try {
    localStorage.setItem(REFERRAL_COOKIE, code);
  } catch {
    // ignore storage errors
  }
}

export function getStoredReferralCode(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${REFERRAL_COOKIE}=([^;]*)`));
  if (match) return decodeURIComponent(match[1]);
  try {
    return localStorage.getItem(REFERRAL_COOKIE);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode() {
  if (typeof document === "undefined") return;
  document.cookie = `${REFERRAL_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  try {
    localStorage.removeItem(REFERRAL_COOKIE);
  } catch {
    // ignore
  }
}

export function buildShareUrls(link: string, message: string) {
  const encodedLink = encodeURIComponent(link);
  const encodedMessage = encodeURIComponent(message);
  return {
    whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedLink}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
  };
}
