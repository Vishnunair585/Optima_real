import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";

import { PublicOnlyRoute } from "../components/auth/route-guard";

function ForgotPasswordRoute() {
  return (
    <PublicOnlyRoute>
      <ForgotPasswordPage />
    </PublicOnlyRoute>
  );
}

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordRoute,
});

function ForgotPasswordPage() {
  const { sendResetLink } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await sendResetLink(email);
      setStatus("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send reset link.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-black/95 px-4 py-12">
      <div className="w-full max-w-[400px] bg-white dark:bg-[#1C1C1C] rounded-md shadow-elegant p-8 relative z-10">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Reset Password</h2>
        <p className="text-sm text-muted-foreground mb-6">Enter your email address and we'll send you a link to reset your password.</p>
        
        {status === "error" && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
            {errorMessage}
          </div>
        )}
        
        {status === "success" ? (
          <div className="text-center">
            <div className="mb-4 p-3 rounded bg-green-50 text-green-600 text-sm border border-green-200">
              Check your email for the reset link!
            </div>
            <Link to="/login" className="text-brand text-sm font-medium hover:underline">Return to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail address"
                className="w-full h-11 px-3 text-[15px] border border-gray-300 dark:border-gray-700 rounded-md bg-transparent outline-none focus:border-brand transition-colors text-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full h-11 bg-[#4A5E68] hover:bg-[#3d4d56] text-white rounded-md font-medium text-[15px] transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center text-[14px]">
          <Link to="/login" className="text-[#555] dark:text-[#ccc] hover:text-brand transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
