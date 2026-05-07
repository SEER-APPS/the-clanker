"use client";

import { useGetAnalyticsQuery } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function AnalyticsIndexPage(): React.ReactElement {
  const { data, isLoading, isError } = useGetAnalyticsQuery();

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Service analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">Infrastructure signals for the API stack.</p>
      </header>
      {isError ? (
        <p className="text-destructive text-sm">Could not load analytics.</p>
      ) : null}
      {isLoading || !data ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Health</CardTitle>
            <div className="flex gap-2">
              <Link
                href="/services/analytics/logs"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Logs
              </Link>
              <Link
                href="/services/analytics/failures"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Failures
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted overflow-auto rounded-md p-3 font-mono text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </article>
  );
}
