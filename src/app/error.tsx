"use client";

import { useEffect } from "react";
import { AdminIncidentFallback } from "@/components/admin/admin-incident-fallback";

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error("admin app error:", error);
  }, [error]);

  return (
    <AdminIncidentFallback
      title="Something went wrong"
      description="An unexpected error occurred in this view. You can try again or return to the dashboard. If the problem persists, contact your team."
      onRetry={reset}
    />
  );
}
