"use client";

import { useMemo, useState } from "react";
import { useGetAnalyticsLogsQuery } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const POLL_NORMAL_MS = 5 * 60 * 1000;
const POLL_LIVE_MS = 2_000;

type LogsPayload = {
  lines?: string[];
  line_count?: number;
};

type RefreshMode = "normal" | "live";

function formatRefreshedAt(ms: number | undefined): string {
  if (!ms) {
    return "—";
  }
  return new Date(ms).toLocaleTimeString();
}

export default function AnalyticsLogsPage(): React.ReactElement {
  const [refreshMode, setRefreshMode] = useState<RefreshMode>("normal");

  const pollingInterval = refreshMode === "live" ? POLL_LIVE_MS : POLL_NORMAL_MS;

  const { data, isLoading, isError, error, isFetching, fulfilledTimeStamp } =
    useGetAnalyticsLogsQuery(
      {},
      {
        pollingInterval,
        refetchOnMountOrArgChange: true,
        refetchOnFocus: refreshMode === "live",
      },
    );

  const errData =
    error && typeof error === "object" && "data" in error
      ? (error as { data?: { message?: string } }).data
      : undefined;

  const payload = data as LogsPayload | undefined;
  const lines = useMemo(() => (payload?.lines ?? []) as string[], [payload?.lines]);
  const lineCount = payload?.line_count ?? lines.length;

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href="/services/analytics"
            className={buttonVariants({ variant: "link", size: "sm" })}
          >
            Back to analytics
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Application logs</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tail from <code className="text-xs">application_logs</code>. Polling runs only while
            you stay on this page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={refreshMode === "normal" ? "default" : "outline"}
            onClick={() => {
              setRefreshMode("normal");
            }}
          >
            Normal
          </Button>
          <Button
            type="button"
            size="sm"
            variant={refreshMode === "live" ? "default" : "outline"}
            onClick={() => {
              setRefreshMode("live");
            }}
          >
            Live
          </Button>
        </div>
      </header>

      <p className="text-muted-foreground text-xs">
        {refreshMode === "live" ? (
          <>Live mode — refreshes every 2 seconds.</>
        ) : (
          <>Normal mode — refreshes every 5 minutes.</>
        )}{" "}
        Last updated: <span className="text-foreground">{formatRefreshedAt(fulfilledTimeStamp)}</span>
        {isFetching ? <span className="ml-2 text-foreground">(refreshing…)</span> : null}
      </p>

      {isError ? (
        <p className="text-destructive text-sm">
          {errData?.message ?? "Could not load logs (ADMIN or SUPER_ADMIN required)."}
        </p>
      ) : null}

      {isLoading && !data ? (
        <section className="space-y-4" aria-busy="true" aria-label="Loading logs">
          <Card className="rounded-none">
            <CardHeader className="border-b py-3">
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[480px] w-full rounded-md" />
            </CardContent>
          </Card>
        </section>
      ) : (
        <Card className="rounded-none">
          <CardHeader className="border-b py-3">
            <CardTitle className="admin-card-title">
              Log tail ({String(lineCount)} lines)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {lineCount === 0 ? (
              <div className="text-muted-foreground space-y-2 rounded-md border border-dashed p-6 text-sm">
                <p className="font-medium text-foreground">No logs yet</p>
                <p>
                  Entries appear when the API records events (startup, admin sign-in, 5xx errors,
                  or clients posting to the log ingest endpoints). Restart core or sign in again to
                  seed a few lines.
                </p>
              </div>
            ) : (
              <pre
                className={cn(
                  "bg-muted max-h-[480px] overflow-y-auto overflow-x-hidden rounded-md p-3 font-mono text-xs whitespace-pre-wrap wrap-break-word",
                  refreshMode === "live" && isFetching && "opacity-90",
                )}
              >
                {lines.join("\n")}
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </article>
  );
}
