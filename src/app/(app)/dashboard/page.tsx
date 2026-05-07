"use client";

import { useGetDashboardQuery } from "@/store/admin-api";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function DashboardPage(): React.ReactElement {
  const { data, isLoading, isError } = useGetDashboardQuery();

  if (isLoading || !data) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-24"
            />
          ))}
        </div>
        <Skeleton className="h-80" />
      </section>
    );
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        The dashboard could not be loaded. Try refreshing the page.
      </p>
    );
  }

  const statCards = [
    { label: "Total users", value: data.stats.total_users },
    { label: "Active users", value: data.stats.active_users },
    { label: "Messages (24h)", value: data.stats.messages_24h },
    { label: "Pending alerts", value: data.stats.pending_alerts },
  ];

  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Overview of users, messaging, alerts, and delivery health.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <DashboardCharts charts={data.charts} />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent users</CardTitle>
            <Link
              href="/users"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Link
                        href={`/users/${u.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {u.name ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{u.phone_number ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent threat alerts</CardTitle>
            <Link
              href="/threat-alerts"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_alerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Link
                        href={`/threat-alerts/${a.id}`}
                        className="text-primary hover:underline"
                      >
                        {a.threat_type}
                      </Link>
                    </TableCell>
                    <TableCell>{a.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
