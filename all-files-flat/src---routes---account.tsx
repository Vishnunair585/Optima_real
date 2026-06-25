import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "../components/auth/route-guard";

export const Route = createFileRoute("/account")({
  component: () => (
    <ProtectedRoute>
      <AccountPage />
    </ProtectedRoute>
  ),
});

function AccountPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-4">Account</h1>
      <p className="text-muted-foreground">Manage your personal account details.</p>
    </div>
  );
}
