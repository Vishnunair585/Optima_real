export interface WebVitalMetric {
  name: "LCP" | "FCP" | "CLS" | "INP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
  url: string;
}

const metrics: WebVitalMetric[] = [];
const MAX_METRICS = 1000;

function getRating(name: string, value: number): WebVitalMetric["rating"] {
  switch (name) {
    case "LCP":
      return value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor";
    case "FCP":
      return value <= 1800 ? "good" : value <= 3000 ? "needs-improvement" : "poor";
    case "CLS":
      return value <= 0.1 ? "good" : value <= 0.25 ? "needs-improvement" : "poor";
    case "INP":
      return value <= 200 ? "good" : value <= 500 ? "needs-improvement" : "poor";
    case "TTFB":
      return value <= 800 ? "good" : value <= 1800 ? "needs-improvement" : "poor";
    default:
      return "needs-improvement";
  }
}

export function recordWebVital(name: WebVitalMetric["name"], value: number, url?: string): void {
  metrics.push({
    name,
    value,
    rating: getRating(name, value),
    timestamp: Date.now(),
    url: url || typeof window !== "undefined" ? window.location.pathname : "/",
  });
  if (metrics.length > MAX_METRICS) metrics.splice(0, metrics.length - MAX_METRICS);
}

export function getWebVitals(limit = 100): WebVitalMetric[] {
  return metrics.slice(-limit).reverse();
}

export function getWebVitalSummary() {
  const summary: Record<string, { count: number; avg: number; good: number; needsImprovement: number; poor: number }> = {};

  for (const name of ["LCP", "FCP", "CLS", "INP", "TTFB"] as const) {
    const entries = metrics.filter((m) => m.name === name);
    if (entries.length === 0) continue;

    summary[name] = {
      count: entries.length,
      avg: Math.round(entries.reduce((s, e) => s + e.value, 0) / entries.length),
      good: entries.filter((e) => e.rating === "good").length,
      needsImprovement: entries.filter((e) => e.rating === "needs-improvement").length,
      poor: entries.filter((e) => e.rating === "poor").length,
    };
  }

  return summary;
}

export function getLighthouseScore(): number {
  const lcp = metrics.filter((m) => m.name === "LCP");
  const fcp = metrics.filter((m) => m.name === "FCP");
  const cls = metrics.filter((m) => m.name === "CLS");
  const inp = metrics.filter((m) => m.name === "INP");
  const ttfb = metrics.filter((m) => m.name === "TTFB");

  if (lcp.length === 0) return 90;

  const lcpGood = lcp.filter((m) => m.rating === "good").length / lcp.length;
  const fcpGood = fcp.length > 0 ? fcp.filter((m) => m.rating === "good").length / fcp.length : 1;
  const clsGood = cls.length > 0 ? cls.filter((m) => m.rating === "good").length / cls.length : 1;
  const inpGood = inp.length > 0 ? inp.filter((m) => m.rating === "good").length / inp.length : 1;
  const ttfbGood = ttfb.length > 0 ? ttfb.filter((m) => m.rating === "good").length / ttfb.length : 1;

  return Math.round((lcpGood + fcpGood + clsGood + inpGood + ttfbGood) / 5 * 100);
}

export function resetWebVitals(): void {
  metrics.length = 0;
}
