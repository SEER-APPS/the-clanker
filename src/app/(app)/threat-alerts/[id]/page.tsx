"use client";

import { use } from "react";
import Link from "next/link";
import { useGetThreatAlertQuery } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ThreatAlertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  const { id: raw } = use(params);
  const id = Number(raw);
  const { data, isLoading, isError } = useGetThreatAlertQuery(id, { skip: !Number.isFinite(id) });

  if (!Number.isFinite(id)) {
    return <p className="text-destructive text-sm">Invalid id.</p>;
  }
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }
  if (isError || !data?.alert) {
    return <p className="text-destructive text-sm">Alert not found.</p>;
  }

  const alert = data.alert as Record<string, unknown>;

  return (
    <article className="space-y-6">
      <header>
        <Link
          href="/threat-alerts"
          className="text-muted-foreground text-sm hover:underline"
        >
          Back to alerts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Alert #{String(alert.id)}
        </h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted max-h-[480px] overflow-auto rounded-md p-3 font-mono text-xs">
            {JSON.stringify(alert, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </article>
  );
}
