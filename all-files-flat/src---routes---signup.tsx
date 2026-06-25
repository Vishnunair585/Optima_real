import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { PublicOnlyRoute } from "../components/auth/route-guard";
import { OptimaLogo } from "../components/site/OptimaLogo";
import { Eye, EyeOff, Loader2, AlertCircle, Check, Gift, ArrowRight } from "lucide-react";
import { getStoredReferralCode } from "../lib/referral/constants";

function SignupRoute() {
  return (
    <PublicOnlyRoute>
      <SignupPage />
    </PublicOnlyRoute>
  );
}

export const Route = createFileRoute("/signup")({
  component: SignupRoute,
});

function calculatePasswordStrength(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const strengthLabels = ["Very Weak", "Weak", "Fair", "Medium", "Strong", "Excellent"];
const strengthColors = ["bg-rose-500", "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-400"];

function SignupPage() {
  const { signUp, loginWithGoogle, loginWithGitHub, loginWithX } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    setReferralCode(getStoredReferralCode());
  }, []);

  const pwdStrength = password ? calculatePasswordStrength(password) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) { setError("Please enter a username."); return; }
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password) { setError("Please enter a password."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (pwdStrength < 4) { setError("Please choose a stronger password."); return; }
    if (!agreedToTerms) { setError("You must agree to the terms of service."); return; }

    setLoading(true);
    try {
      await signUp(email, password, username);
      navigate({ to: "/verify-email" });
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
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
      setError(err.message || `${provider} sign up failed.`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <OptimaLogo className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Start building custom AI workflows in minutes</p>
          {referralCode && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs text-brand">
              <Gift className="h-3.5 w-3.5" />
              Referred by {referralCode}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 shadow-elegant">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                autoComplete="username"
                className="w-full h-11 px-3.5 text-sm rounded-xl border border-border bg-background/60 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
              />
            </div>

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
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                    <span>Strength: <span className="font-semibold">{strengthLabels[pwdStrength]}</span></span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div key={level} className={`h-full flex-1 rounded-full transition-all duration-300 ${level <= pwdStrength ? strengthColors[pwdStrength] : "bg-muted-foreground/20"}`} />
                    ))}
                  </div>
                  <ul className="text-[10px] text-muted-foreground space-y-0.5 mt-1">
                    <li className={password.length >= 8 ? "text-emerald-400" : ""}>• Minimum 8 characters</li>
                    <li className={/[A-Z]/.test(password) ? "text-emerald-400" : ""}>• At least one uppercase letter</li>
                    <li className={/[a-z]/.test(password) ? "text-emerald-400" : ""}>• At least one lowercase letter</li>
                    <li className={/[0-9]/.test(password) ? "text-emerald-400" : ""}>• At least one number</li>
                    <li className={/[^A-Za-z0-9]/.test(password) ? "text-emerald-400" : ""}>• At least one special character</li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className="w-full h-11 px-3.5 text-sm rounded-xl border border-border bg-background/60 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-brand cursor-pointer"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I agree to the{" "}
                <Link to="/terms" className="text-brand hover:underline">Terms of Service</Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-brand hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand text-sm font-semibold text-brand-foreground shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">Or sign up with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin("Google", loginWithGoogle)}
              disabled={socialLoading !== null}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/40 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
              title="Sign up with Google"
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
              title="Sign up with GitHub"
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
              onClick={() => handleSocialLogin("Twitter", loginWithX)}
              disabled={socialLoading !== null}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/40 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
              title="Sign up with Twitter/X"
            >
              {socialLoading === "Twitter" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 512 512" fill="currentColor">
                  <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand hover:underline transition-colors">
            Sign in <ArrowRight className="inline h-3 w-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
