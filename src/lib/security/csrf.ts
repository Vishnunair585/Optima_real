const csrfTokens = new Map<string, { token: string; expiresAt: number }>();
const TOKEN_TTL = 60 * 60 * 1000;

export function generateCsrfToken(sessionId: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  csrfTokens.set(sessionId, { token, expiresAt: Date.now() + TOKEN_TTL });
  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const record = csrfTokens.get(sessionId);
  if (!record || record.expiresAt < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }
  const valid = record.token === token;
  if (valid) csrfTokens.delete(sessionId);
  return valid;
}

export function getCsrfToken(sessionId: string): string | null {
  const record = csrfTokens.get(sessionId);
  if (!record || record.expiresAt < Date.now()) {
    csrfTokens.delete(sessionId);
    return null;
  }
  return record.token;
}

export function clearCsrfToken(sessionId: string): void {
  csrfTokens.delete(sessionId);
}
