import { Link } from "@tanstack/react-router";
import { Sparkles, Github, Twitter } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { to: "/finder", label: "AI Finder" },
      { to: "/rankings", label: "Rankings" },
      { to: "/compare", label: "Compare" },
      { to: "/stack-builder", label: "Stack Builder" },
    ],
  },
  {
    title: "Discover",
    links: [
      { to: "/agents", label: "Agent Hub" },
      { to: "/app-builders", label: "App Builders" },
      { to: "/calculator", label: "Cost Calculator" },
      { to: "/prompts", label: "Prompt Library" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/", label: "About" },
      { to: "/", label: "Blog" },
      { to: "/", label: "Changelog" },
      { to: "/", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-32 border-t border-border">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 shrink-0">
              <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8">
                <defs>
                  <linearGradient id="footer-logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <path 
                  d="M6 18 L14 26 L26 14 L18 6 Z" 
                  stroke="url(#footer-logo-grad)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <path 
                  d="M12 20 L24 8 M24 8 H16 M24 8 V16" 
                  stroke="url(#footer-logo-grad)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </div>
            <span className="font-display text-xl font-bold">Optima</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            The AI Decision Engine. Find, compare, and build with the best AI tools — backed by data, not vibes.
          </p>
          <div className="mt-6 flex gap-2">
            <a href="#" className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><Github className="h-4 w-4" /></a>
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-display text-sm font-semibold">{col.title}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {col.links.map((l, i) => (
                <li key={i}><Link to={l.to} className="transition-colors hover:text-foreground">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Optima. Built for the AI generation.</p>
          <p className="font-mono">All systems operational · 99.99% uptime</p>
        </div>
      </div>
    </footer>
  );
}
