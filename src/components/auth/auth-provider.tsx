import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import {
  signUpFn,
  loginFn,
  logoutFn,
  getSessionFn,
  requestPasswordResetFn,
  resetPasswordFn,
  updateAvatarFn
} from "../../lib/api/auth.functions";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role?: string;
  email_verified: boolean;
  onboarded: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signUp: (email: string, password?: string, username?: string) => Promise<boolean>;
  logout: () => void;
  sendResetLink: (email: string) => Promise<boolean>;
  resetPassword: (password: string, token: string) => Promise<boolean>;
  updateAvatar: (avatarBase64: string) => Promise<boolean>;
  refreshSession: () => Promise<void>;

  // Stubs for OAuth
  loginWithGoogle: () => Promise<boolean>;
  loginWithGitHub: () => Promise<boolean>;
  loginWithApple: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchSession = async () => {
    try {
      const session = await getSessionFn();
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to get session", error);
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error("Password is required");
    try {
      await loginFn({ data: { email, password } });
      await fetchSession();
      toast.success("Successfully logged in!");
      return true;
    } catch (err: any) {
      throw new Error(err.message || "Login failed");
    }
  };

  const signUp = async (email: string, password?: string, username?: string) => {
    if (!password) throw new Error("Password is required");
    if (!username) throw new Error("Username is required");
    try {
      await signUpFn({ data: { email, password, username } });
      await fetchSession();
      toast.success("Account created successfully!");
      return true;
    } catch (err: any) {
      throw new Error(err.message || "Sign up failed");
    }
  };

  const logout = async () => {
    try {
      await logoutFn();
      setUser(null);
      toast.success("Logged out successfully.");
      window.location.href = "/";
    } catch (err) {
      console.error(err);
    }
  };

  const sendResetLink = async (email: string) => {
    try {
      await requestPasswordResetFn({ data: { email } });
      toast.success("Password reset link sent to your email!");
      return true;
    } catch (err: any) {
      throw new Error(err.message || "Failed to send reset link");
    }
  };

  const resetPassword = async (password: string, token: string) => {
    try {
      await resetPasswordFn({ data: { password, token } });
      toast.success("Password reset successfully! You can now log in.");
      return true;
    } catch (err: any) {
      throw new Error(err.message || "Failed to reset password");
    }
  };

  const updateAvatar = async (avatarBase64: string) => {
    try {
      await updateAvatarFn({ data: { avatar: avatarBase64 } });
      await fetchSession();
      toast.success("Profile picture updated!");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile picture");
      return false;
    }
  };

  const refreshSession = async () => {
    await fetchSession();
  };

  const loginWithGoogle = async () => { toast.info("Google login not supported yet"); return false; };
  const loginWithGitHub = async () => { toast.info("GitHub login not supported yet"); return false; };
  const loginWithApple = async () => { toast.info("Apple login not supported yet"); return false; };

  return (
    <AuthContext.Provider value={{
      user,
      isLoaded,
      isSignedIn: !!user,
      login,
      signUp,
      logout,
      sendResetLink,
      resetPassword,
      updateAvatar,
      refreshSession,
      loginWithGoogle,
      loginWithGitHub,
      loginWithApple,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
