"use client";

import { useGetAnalyticsLogsQuery } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function AnalyticsLogsPage(): React.ReactElement {
  const { data, isLoading, isError, error } = useGetAnalyticsLogsQuery({});

  const errData =
    error && typeof error === "object" && "data" in error
      ? (error as { data?: { message?: string } }).data
      : undefined;

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/services/analytics"
            className={buttonVariants({ variant: "link", size: "sm" })}
          >
            Back to analytics
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Application logs</h1>
          <p className="text-muted-foreground mt-1 text-sm">Super admin only on the API.</p>
        </div>
      </header>
      {isError ? (
        <p className="text-destructive text-sm">
          {errData?.message ?? "Could not load logs (check super admin access)."}
        </p>
      ) : null}
      {isLoading || !data ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Tail ({String((data as { line_count?: number }).line_count ?? 0)} lines)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="bg-muted max-h-[480px] overflow-auto rounded-md p-3 font-mono text-xs">
              {((data as { lines?: string[] }).lines ?? []).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </article>
  );
}
