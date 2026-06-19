import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "../components/auth/route-guard";

export const Route = createFileRoute("/subscription")({
  component: () => (
    <ProtectedRoute>
      <SubscriptionPage />
    </ProtectedRoute>
  ),
});

function SubscriptionPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-4">Subscription</h1>
      <p className="text-muted-foreground">Manage your billing and Stripe details here.</p>
    </div>
  );
}
