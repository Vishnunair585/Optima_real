import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Sun, Moon, LogOut, User as UserIcon, Settings as SettingsIcon, CreditCard as CreditCardIcon, FolderClosed as FolderClosedIcon, Gift, Trophy } from "lucide-react";
import { useAuth } from "../../hooks/use-auth";
import { OptimaLogo } from "./OptimaLogo";

const nav = [
  { to: "/finder", label: "AI Finder" },
  { to: "/rankings", label: "Rankings" },
  { to: "/compare", label: "Compare" },
  { to: "/stack-builder", label: "Stack Builder" },
  { to: "/stacks", label: "Public Stacks" },
  { to: "/agents", label: "Agents" },
  { to: "/prompts", label: "Prompts" },
  { to: "/community", label: "Community" },
];

export function SiteHeader() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "dark" | "light") ?? "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className={`sticky top-0 z-50 transition-all ${scrolled || isOpen ? "border-b border-border glass-strong" : ""}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <OptimaLogo className="h-9 w-9" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "rounded-full px-3 py-1.5 text-sm bg-accent text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-3">
          {/* Light/Dark Mode Toggle (Desktop) */}
          <button 
            onClick={toggleTheme} 
            className="hidden h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-accent sm:grid"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Authentication State Button */}
          {user ? (
            <div className="relative hidden items-center gap-2 sm:flex">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card/60 px-4 text-sm font-medium hover:bg-accent transition-all duration-200 cursor-pointer"
              >
                <div className="grid h-5 w-5 place-items-center rounded-full bg-gradient-brand text-[9px] font-bold text-brand-foreground shadow-glow overflow-hidden">
                  {user.avatar && user.avatar.startsWith('data:') ? (
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{user.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {user.name}
              </button>

              {showDropdown && (
                <>
                  {/* Overlay click-catcher */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  
                  {/* Dropdown Card */}
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-border bg-background/95 backdrop-blur-xl p-2 shadow-elegant animate-scale-in">
                    <div className="px-3 py-2.5 border-b border-border/50 text-left">
                      <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-mono uppercase bg-brand/10 border border-brand/20 rounded-full text-brand">Member</span>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setShowDropdown(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
                      >
                        <FolderClosedIcon className="h-3.5 w-3.5" />
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
                      >
                        <UserIcon className="h-3.5 w-3.5" />
                        My Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setShowDropdown(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
                      >
                        <SettingsIcon className="h-3.5 w-3.5" />
                        Settings
                      </Link>
                      <Link
                        to="/subscription"
                        onClick={() => setShowDropdown(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
                      >
                        <CreditCardIcon className="h-3.5 w-3.5" />
                        Subscription
                      </Link>
                      <Link
                        to="/referrals"
                        onClick={() => setShowDropdown(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
                      >
                        <Gift className="h-3.5 w-3.5" />
                        Referrals
                      </Link>
                      <Link
                        to="/leaderboard"
                        onClick={() => setShowDropdown(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        Leaderboard
                      </Link>
                    </div>

                    <div className="border-t border-border/50 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs hover:bg-destructive/15 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden h-9 items-center justify-center rounded-full bg-gradient-brand px-4 text-sm font-medium text-brand-foreground shadow-glow transition-transform hover:scale-[1.02] sm:inline-flex"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-accent lg:hidden"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* Styled Mobile Menu Drawer Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-16 z-50 border-b border-border bg-background/98 backdrop-blur-xl p-6 shadow-elegant lg:hidden flex flex-col gap-6 animate-scale-in">
          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground border-b border-border/10 last:border-0"
                activeProps={{ className: "rounded-xl px-4 py-3 text-sm font-medium bg-accent text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* User Settings & Controls (Mobile) */}
          <div className="flex flex-col gap-3 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Select Theme</span>
              <button 
                onClick={toggleTheme} 
                className="flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-xs font-medium w-36 hover:bg-accent"
              >
                {theme === "dark" ? (
                  <><Sun className="h-3.5 w-3.5" /> Light Mode</>
                ) : (
                  <><Moon className="h-3.5 w-3.5" /> Dark Mode</>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-border/10 pt-3">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Account Status</span>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card/60 px-4 text-xs font-medium hover:bg-accent"
                  >
                    <div className="grid h-5 w-5 place-items-center rounded-full bg-gradient-brand text-[8px] font-bold text-brand-foreground overflow-hidden">
                      {user.avatar && user.avatar.startsWith('data:') ? (
                        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>{user.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    Profile
                  </Link>
                  <button 
                    onClick={() => { logout(); setIsOpen(false); }} 
                    className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition-all"
                    aria-label="Logout"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-brand px-6 text-xs font-semibold text-brand-foreground shadow-glow w-36"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
