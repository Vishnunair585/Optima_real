import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";

import { PublicOnlyRoute } from "../components/auth/route-guard";

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

function LoginPage() {
  const { login, loginWithGoogle, loginWithGitHub, loginWithApple } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-black/95 px-4 py-12">
      <div className="w-full max-w-[400px] bg-white dark:bg-[#1C1C1C] rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8">
        
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Username or E-mail"
              className="w-full h-11 px-3 text-[15px] border border-gray-300 dark:border-gray-700 rounded-md bg-transparent outline-none focus:border-brand transition-colors text-foreground relative z-20"
            />
          </div>

          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-11 px-3 text-[15px] border border-gray-300 dark:border-gray-700 rounded-md bg-transparent outline-none focus:border-brand transition-colors text-foreground relative z-20"
            />
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-[13px] text-gray-500 hover:text-brand transition-colors">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#4A5E68] hover:bg-[#3d4d56] text-white rounded-md font-medium text-[15px] transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-[14px]">
          <span className="text-gray-500">Don't have an account?</span>{" "}
          <Link to="/signup" className="text-[#555] dark:text-[#ccc] hover:text-brand transition-colors">
            Sign Up
          </Link>
        </div>

        <div className="mt-8 mb-6 relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
          </div>
          <div className="relative bg-white dark:bg-[#1C1C1C] px-4 text-[13px] text-gray-400">
            or you can sign in with
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={loginWithGoogle}
            className="w-10 h-10 rounded-full bg-[#E5E5E5] hover:bg-gray-300 dark:bg-[#333] dark:hover:bg-[#444] flex items-center justify-center transition-colors text-gray-600 dark:text-gray-300"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
             </svg>
          </button>
          <button 
            onClick={loginWithGitHub}
            className="w-10 h-10 rounded-full bg-[#E5E5E5] hover:bg-gray-300 dark:bg-[#333] dark:hover:bg-[#444] flex items-center justify-center transition-colors text-gray-600 dark:text-gray-300"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
               <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
             </svg>
          </button>
          <button 
            onClick={loginWithApple}
            className="w-10 h-10 rounded-full bg-[#E5E5E5] hover:bg-gray-300 dark:bg-[#333] dark:hover:bg-[#444] flex items-center justify-center transition-colors text-gray-600 dark:text-gray-300"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.1,16.4c-0.6,0.9-1.3,1.8-2.4,1.8c-1,0-1.4-0.6-2.6-0.6c-1.2,0-1.6,0.6-2.6,0.6c-1,0-1.8-0.9-2.4-1.8 C4.7,14.4,4,11.2,5.2,8.9c0.6-1.1,1.8-1.8,3-1.8c1,0,1.9,0.7,2.5,0.7c0.6,0,1.7-0.9,3-0.8c1.3,0.1,2.5,0.6,3.2,1.6 c-2.6,1.5-2.1,5.2,0.4,6.3C17,15.5,16.6,16,16.1,16.4z M13.8,4.6c0.5-0.7,0.8-1.5,0.7-2.3c-0.8,0-1.6,0.3-2.2,0.9 C11.8,3.8,11.5,4.6,11.6,5.4C12.4,5.4,13.2,5.1,13.8,4.6z"/>
             </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
