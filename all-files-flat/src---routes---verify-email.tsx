import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "../hooks/use-auth";
import { Mail, RefreshCw, LogOut, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { OptimaLogo } from "../components/site/OptimaLogo";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { user, isLoaded, verifyOtp, resendOtp, logout } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate({ to: "/login" });
    }
    if (isLoaded && user?.email_verified && !verified) {
      navigate({ to: user.onboarded ? "/dashboard" : "/onboarding" });
    }
  }, [user, isLoaded, navigate, verified]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i]!;
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }
    if (!user?.email) return;

    setSubmitting(true);
    try {
      const success = await verifyOtp(user.email, code);
      if (success) {
        setVerified(true);
        setTimeout(() => {
          navigate({ to: user.onboarded ? "/dashboard" : "/onboarding" });
        }, 1500);
      } else {
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      await resendOtp(user.email);
      setResent(true);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse-glow h-8 w-8 rounded-full bg-brand/30" />
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
        <div className="w-full max-w-[420px] text-center">
          <div className="rounded-2xl border border-emerald-500/20 bg-card/50 backdrop-blur-sm p-8 shadow-elegant space-y-6">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Email verified!</h2>
            <p className="text-sm text-muted-foreground">Redirecting you to your account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <OptimaLogo className="h-12 w-12" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-8 shadow-elegant text-center space-y-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand/10 border border-brand/20 text-brand">
            <Mail className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight">Verify your email</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold text-foreground">{user.email}</span>
            </p>
          </div>

          {resent && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 text-left">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>New code sent! Check your inbox.</span>
            </div>
          )}

          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-border/60 bg-background text-center text-lg font-bold tracking-wider outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                style={{ fontVariantNumeric: "tabular-nums" }}
              />
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || otp.join("").length !== 6}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand text-sm font-semibold text-brand-foreground shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
              ) : (
                <><CheckCircle className="h-4 w-4" /> Verify email</>
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={resending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/40 text-sm font-semibold hover:bg-accent hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
            >
              {resending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><RefreshCw className="h-4 w-4" /> Resend code</>
              )}
            </button>

            <button
              onClick={() => logout()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Use a different email
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Didn't receive the code? Check your spam folder or{" "}
          <button onClick={handleResend} className="text-brand underline hover:no-underline cursor-pointer">
            request a new one
          </button>
        </p>
      </div>
    </div>
  );
}
