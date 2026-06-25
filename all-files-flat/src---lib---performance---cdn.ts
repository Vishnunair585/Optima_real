export interface CDNConfig {
  images: string;
  static: string;
  fonts: string;
  uploads: string;
}

export const CDN_CONFIG: CDNConfig = {
  images: process.env.CDN_URL || process.env.VITE_CDN_URL || "",
  static: process.env.CDN_STATIC_URL || process.env.VITE_CDN_STATIC_URL || "",
  fonts: process.env.CDN_FONTS_URL || process.env.VITE_CDN_FONTS_URL || "",
  uploads: process.env.CDN_UPLOADS_URL || process.env.VITE_CDN_UPLOADS_URL || "",
};

export function cdnUrl(type: keyof CDNConfig, path: string): string {
  const base = CDN_CONFIG[type];
  if (!base) return path;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base.replace(/\/$/, "")}/${cleanPath}`;
}

export function imageCdnUrl(path: string, opts?: { width?: number; quality?: number; format?: "webp" | "avif" }): string {
  const base = CDN_CONFIG.images;
  if (!base) return path;
  const cleanPath = path.replace(/^https?:\/\/[^\/]+/, "").replace(/^\//, "");
  let url = `${base.replace(/\/$/, "")}/${cleanPath}`;
  const params = new URLSearchParams();
  if (opts?.width) params.set("w", String(opts.width));
  if (opts?.quality) params.set("q", String(opts.quality));
  if (opts?.format) params.set("f", opts.format);
  const qs = params.toString();
  if (qs) url += `?${qs}`;
  return url;
}

export function isCdnConfigured(): boolean {
  return !!(CDN_CONFIG.images || CDN_CONFIG.static);
}
