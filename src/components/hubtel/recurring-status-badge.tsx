"use client";

import { Badge } from "@/components/ui/badge";

export function RecurringStatusBadge({
  status,
}: {
  status: string | null | undefined;
}): React.ReactElement {
  const s = (status ?? "").toLowerCase();
  if (s === "active") {
    return <Badge variant="white">Active</Badge>;
  }
  if (s === "pending_verification") {
    return <Badge variant="gray">Pending verification</Badge>;
  }
  if (s === "pending_approval") {
    return <Badge variant="gray">Awaiting MoMo approval</Badge>;
  }
  if (s === "payment_failed") {
    return <Badge variant="dark">Payment failed</Badge>;
  }
  if (s === "cancelled") {
    return <Badge variant="mid">Cancelled</Badge>;
  }
  if (s === "expired") {
    return <Badge variant="outline">Expired</Badge>;
  }
  return <Badge variant="gray">{status || "—"}</Badge>;
}
