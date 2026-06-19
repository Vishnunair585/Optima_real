import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "../components/auth/route-guard";
import { useAuth } from "../hooks/use-auth";

function DashboardRoute() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});

function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="glass p-6 rounded-xl border border-border">
        <h2 className="text-xl font-semibold mb-2">Welcome back, {user?.name}</h2>
        <p className="text-muted-foreground">Email: {user?.email}</p>
      </div>
    </div>
  );
}
