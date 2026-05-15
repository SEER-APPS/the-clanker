"use client";

import { Badge } from "@/components/ui/badge";

export function HubtelStatusBadge({
  status,
}: {
  status: string | null | undefined;
}): React.ReactElement {
  const s = (status ?? "").toLowerCase();
  if (s === "success") {
    return <Badge variant="white">Success</Badge>;
  }
  if (s === "failed") {
    return <Badge variant="dark">Failed</Badge>;
  }
  if (s === "pending") {
    return <Badge variant="gray">Pending</Badge>;
  }
  return <Badge variant="gray">{status || "—"}</Badge>;
}
