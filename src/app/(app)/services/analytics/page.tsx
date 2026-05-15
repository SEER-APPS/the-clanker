"use client";

import { useGetAnalyticsQuery } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <Skeleton className="h-5 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 max-w-2xl w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
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
          <CardContent className="space-y-3 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Database</dt>
                <dd className="font-medium">
                  {(data as { db_ok?: boolean }).db_ok ? "Connected" : "Unavailable"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">In-process cache</dt>
                <dd className="font-medium">
                  {(data as { cache_ok?: boolean }).cache_ok ? "OK" : "Probe failed"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">API health</dt>
                <dd className="font-medium">
                  {(data as { api_health_ok?: boolean }).api_health_ok ? "OK" : "Degraded"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Your role</dt>
                <dd className="font-medium">
                  {(data as { is_super_admin?: boolean }).is_super_admin
                    ? "SUPER_ADMIN"
                    : "Staff"}
                </dd>
              </div>
            </dl>
            <p className="text-muted-foreground text-xs">
              {(data as { app_up_note?: string }).app_up_note}
            </p>
          </CardContent>
        </Card>
      )}
    </article>
  );
}
