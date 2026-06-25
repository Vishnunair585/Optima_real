import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "../components/auth/route-guard";

export const Route = createFileRoute("/settings")({
  component: () => (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  ),
});

function SettingsPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <p className="text-muted-foreground">Manage your account settings here.</p>
    </div>
  );
}
