export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string | false;
  hstsMaxAge?: number;
  hstsIncludeSubdomains?: boolean;
  hstsPreload?: boolean;
  frameOptions?: "DENY" | "SAMEORIGIN";
  contentTypeOptions?: "nosniff";
  referrerPolicy?: "strict-origin-when-cross-origin" | "same-origin" | "no-referrer" | "strict-origin";
  permissionsPolicy?: string | false;
  xssProtection?: "0" | "1; mode=block";
  exposeHeaders?: string[];
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.sentry.io ws: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  hstsMaxAge: 31536000,
  hstsIncludeSubdomains: true,
  hstsPreload: false,
  frameOptions: "DENY",
  contentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: "camera=(), microphone=(), geolocation=()",
  xssProtection: "1; mode=block",
  exposeHeaders: [],
};

export function buildSecurityHeaders(config?: Partial<SecurityHeadersConfig>): Record<string, string> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const headers: Record<string, string> = {};

  if (cfg.contentSecurityPolicy !== false) {
    headers["Content-Security-Policy"] = cfg.contentSecurityPolicy;
  }

  if (cfg.hstsMaxAge) {
    let hsts = `max-age=${cfg.hstsMaxAge}`;
    if (cfg.hstsIncludeSubdomains) hsts += "; includeSubDomains";
    if (cfg.hstsPreload) hsts += "; preload";
    headers["Strict-Transport-Security"] = hsts;
  }

  if (cfg.frameOptions) headers["X-Frame-Options"] = cfg.frameOptions;
  if (cfg.contentTypeOptions) headers["X-Content-Type-Options"] = cfg.contentTypeOptions;
  if (cfg.referrerPolicy) headers["Referrer-Policy"] = cfg.referrerPolicy;

  if (cfg.permissionsPolicy !== false) {
    headers["Permissions-Policy"] = cfg.permissionsPolicy;
  }

  if (cfg.xssProtection) headers["X-XSS-Protection"] = cfg.xssProtection;
  if (cfg.exposeHeaders?.length) headers["Access-Control-Expose-Headers"] = cfg.exposeHeaders.join(", ");

  return headers;
}

export const DEFAULT_SECURITY_HEADERS = buildSecurityHeaders();
