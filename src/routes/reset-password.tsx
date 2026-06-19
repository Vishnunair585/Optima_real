import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";

import { PublicOnlyRoute } from "../components/auth/route-guard";

function ResetPasswordRoute() {
  return (
    <PublicOnlyRoute>
      <ResetPasswordPage />
    </PublicOnlyRoute>
  );
}

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordRoute,
});

function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  // We use URLSearchParams directly to keep it simple, or TanStack Router's built in search types
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setStatus("error");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      setStatus("error");
      return;
    }

    try {
      await resetPassword(password, token);
      setStatus("success");
      setTimeout(() => navigate({ to: "/login" }), 2000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password.");
      setStatus("error");
    }
  };

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-black/95 px-4 py-12">
        <div className="w-full max-w-[400px] bg-white dark:bg-[#1C1C1C] rounded-md shadow-elegant p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Invalid Reset Link</h2>
          <p className="text-gray-500 mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-brand hover:underline">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-black/95 px-4 py-12">
      <div className="w-full max-w-[400px] bg-white dark:bg-[#1C1C1C] rounded-md shadow-elegant p-8 relative z-10">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Create New Password</h2>
        <p className="text-sm text-muted-foreground mb-6">Please enter your new password below.</p>
        
        {status === "error" && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
            {errorMessage}
          </div>
        )}
        
        {status === "success" ? (
          <div className="text-center">
            <div className="mb-4 p-3 rounded bg-green-50 text-green-600 text-sm border border-green-200">
              Password has been successfully reset! Redirecting to login...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New Password"
                className="w-full h-11 px-3 text-[15px] border border-gray-300 dark:border-gray-700 rounded-md bg-transparent outline-none focus:border-brand transition-colors text-foreground"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full h-11 px-3 text-[15px] border border-gray-300 dark:border-gray-700 rounded-md bg-transparent outline-none focus:border-brand transition-colors text-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full h-11 bg-[#4A5E68] hover:bg-[#3d4d56] text-white rounded-md font-medium text-[15px] transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
