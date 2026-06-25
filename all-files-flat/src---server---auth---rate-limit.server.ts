const rateLimits = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimits.get(key);

  if (!record || record.expiresAt < now) {
    rateLimits.set(key, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

// Clean up expired rate limits occasionally (can be called periodically or manually)
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, record] of rateLimits.entries()) {
    if (record.expiresAt < now) {
      rateLimits.delete(key);
    }
  }
}
