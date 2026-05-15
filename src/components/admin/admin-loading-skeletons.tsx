"use client";

import type { ReactElement } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Matches the main dashboard: stats, charts, two recent tables. */
export function DashboardOverviewSkeleton({ className }: { className?: string }): ReactElement {
  return (
    <article className={cn("space-y-6", className)} aria-busy="true" aria-label="Loading dashboard">
      <header className="space-y-2">
        <Skeleton className="h-9 w-44 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </header>
      <section className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="admin-stat-tile space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-14" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-none" />
        <Skeleton className="h-64 w-full rounded-none" />
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <AdminRecentTableSkeleton />
        <AdminRecentTableSkeleton />
      </section>
    </article>
  );
}

function AdminRecentTableSkeleton(): ReactElement {
  return (
    <Card className="rounded-none">
      <CardHeader className="flex flex-row items-center justify-between border-b py-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="admin-table-heavy-divider">
            <TableRow>
              {["w-24", "w-28", "w-16", "w-20"].map((w) => (
                <TableHead key={w} className="admin-table-head">
                  <Skeleton className={cn("h-3", w)} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AdminTableBodySkeleton
              rows={5}
              cellWidths={["w-28 max-w-full", "w-24", "w-14", "w-16"]}
            />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/** Skeleton rows only — use inside an existing `<Table>` that already defines `<TableHeader>`. */
export function AdminTableBodySkeleton({
  rows,
  cellWidths,
}: {
  rows: number;
  cellWidths: string[];
}): ReactElement {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={`sk-${r}`}>
          {cellWidths.map((cw, c) => (
            <TableCell key={c}>
              <Skeleton className={cn("h-4", cw)} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/** Full-width detail / profile style layout. */
export function AdminDetailPageSkeleton({
  className,
  fieldRows = 8,
}: {
  className?: string;
  fieldRows?: number;
}): ReactElement {
  return (
    <article
      className={cn("space-y-6", className)}
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Card className="rounded-none">
        <CardHeader className="border-b py-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {Array.from({ length: fieldRows }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <Skeleton className="h-4 w-32 shrink-0 sm:w-40" />
              <Skeleton className="h-4 flex-1 max-w-xl" />
            </div>
          ))}
        </CardContent>
      </Card>
    </article>
  );
}

/** Settings layout: nav rail + main panel. */
export function AdminSettingsPageSkeleton({ className }: { className?: string }): ReactElement {
  return (
    <article
      className={cn("space-y-6", className)}
      aria-busy="true"
      aria-label="Loading settings"
    >
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <section className="grid gap-6 md:grid-cols-[220px_1fr] md:items-start">
        <div className="hidden flex-col gap-2 md:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <Card className="rounded-none">
          <CardHeader className="border-b py-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full max-w-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full max-w-md" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
