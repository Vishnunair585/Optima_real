import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { PublicOnlyRoute } from "../components/auth/route-guard";
import { OptimaLogo } from "../components/site/OptimaLogo";
import { Eye, EyeOff, Loader2, AlertCircle, Check, ArrowRight } from "lucide-react";
import { z } from "zod";

function LoginRoute() {
  return (
    <PublicOnlyRoute>
      <LoginPage />
    </PublicOnlyRoute>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginRoute,
});

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
  verified: z.string().optional(),
  reset: z.string().optional(),
});

function LoginPage() {
  const { login, loginWithGoogle, loginWithGitHub, loginWithX } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: Route.id });
  const redirectTo = (search as any).redirect || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const verified = (search as any).verified === "true";
  const justReset = (search as any).reset === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password) { setError("Please enter your password."); return; }

    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: redirectTo });
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string, fn: () => Promise<boolean>) => {
    setSocialLoading(provider);
    setError("");
    try {
      await fn();
    } catch (err: any) {
      setError(err.message || `${provider} login failed.`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <OptimaLogo className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Sign in to your account to continue</p>
        </div>

        {/* Alerts */}
        {verified && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4 shrink-0" />
            <span>Email verified successfully! You can now sign in.</span>
          </div>
        )}

        {justReset && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4 shrink-0" />
            <span>Password reset successfully! Please sign in with your new password.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 shadow-elegant">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full h-11 px-3.5 text-sm rounded-xl border border-border bg-background/60 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full h-11 pl-3.5 pr-10 text-sm rounded-xl border border-border bg-background/60 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs font-medium text-brand hover:underline transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand text-sm font-semibold text-brand-foreground shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
              ) : (
                <><ArrowRight className="h-4 w-4" /> Sign In</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin("Google", loginWithGoogle)}
              disabled={socialLoading !== null}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/40 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
            >
              {socialLoading === "Google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin("GitHub", loginWithGitHub)}
              disabled={socialLoading !== null}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/40 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
            >
              {socialLoading === "GitHub" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin("Twitter/X", loginWithX)}
              disabled={socialLoading !== null}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/40 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
            >
              {socialLoading === "Twitter/X" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 512 512" fill="currentColor">
                  <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-brand hover:underline transition-colors">
            Create one <ArrowRight className="inline h-3 w-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
