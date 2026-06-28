"use client";

import { useGetDashboardQuery } from "@/store/admin-api";
import { SupportConversationRow } from "@/components/admin/support-conversation-row";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardOverviewSkeleton } from "@/components/admin/admin-loading-skeletons";
import { Badge } from "@/components/ui/badge";
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

function formatOverviewDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthDay(dateIso: string | null): string {
  if (!dateIso) {
    return "—";
  }
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatRelative(dateIso: string | null): string {
  if (!dateIso) {
    return "—";
  }
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  const deltaMs = Date.now() - d.getTime();
  const mins = Math.floor(deltaMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function stat(stats: Record<string, number>, key: string): number {
  return stats[key] ?? 0;
}

export default function DashboardPage(): React.ReactElement {
  const { data, isLoading, isError } = useGetDashboardQuery();

  if (isLoading || !data) {
    return <DashboardOverviewSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        The dashboard could not be loaded. Try refreshing the page.
      </p>
    );
  }

  const stats = data.stats;
  const overviewDate = formatOverviewDate(new Date());

  return (
    <article className="space-y-6">
      <header>
        <h1 className="admin-page-title">Overview</h1>
        <p className="admin-page-sub">Platform activity — {overviewDate}</p>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="admin-stat-tile">
          <div className="admin-stat-label">Total Users</div>
          <div className="admin-stat-value">{stat(stats, "total_users")}</div>
          <div className="admin-stat-sub">+{stat(stats, "new_users_week")} this week</div>
        </div>
        <div className="admin-stat-tile">
          <div className="admin-stat-label">Active Users</div>
          <div className="admin-stat-value">{stat(stats, "active_users")}</div>
          <div className="admin-stat-sub">
            {stat(stats, "total_users")
              ? Math.round((stat(stats, "active_users") / stat(stats, "total_users")) * 100)
              : 0}
            % of total
          </div>
        </div>
        <div className="admin-stat-tile">
          <div className="admin-stat-label">
            Messages <span className="text-[9px] font-medium text-muted-foreground">(live 24h window)</span>
          </div>
          <div className="admin-stat-value">{stat(stats, "messages_24h")}</div>
          <div className="admin-stat-sub">
            {stat(stats, "messages_today")} sent today · auto-pruned after 24h
          </div>
        </div>
        <div className="admin-stat-tile">
          <div className="admin-stat-label">Threat Alerts</div>
          <div className="admin-stat-value">{stat(stats, "total_alerts")}</div>
          <div className="admin-stat-sub">
            {stat(stats, "pending_alerts")} pending · {stat(stats, "confirmed_alerts")} confirmed
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="admin-stat-tile">
          <div className="admin-stat-label">Blocked Users</div>
          <div className="admin-stat-value">{stat(stats, "blocked_users")}</div>
          <div className="admin-stat-sub">{stat(stats, "new_users_today")} new users today</div>
        </div>
        <div className="admin-stat-tile">
          <div className="admin-stat-label">Notifications Today</div>
          <div className="admin-stat-value">{stat(stats, "notifications_today")}</div>
          <div className="admin-stat-sub">{stat(stats, "failed_notifications")} failed</div>
        </div>
        <div className="admin-stat-tile">
          <div className="admin-stat-label">Alerts Sent</div>
          <div className="admin-stat-value">{stat(stats, "sent_alerts")}</div>
          <div className="admin-stat-sub">{stat(stats, "cancelled_alerts")} cancelled</div>
        </div>
        <div className="admin-stat-tile">
          <div className="admin-stat-label">Open Support</div>
          <div className="admin-stat-value">{stat(stats, "open_support_threads")}</div>
          <div className="admin-stat-sub">
            {stat(stats, "support_messages_today")} customer messages today
          </div>
        </div>
        <Link href="/services/orders/failures" className="admin-stat-tile hover:bg-muted/40 transition-colors">
          <div className="admin-stat-label">Service delivery failures</div>
          <div className="admin-stat-value text-destructive">{stat(stats, "service_delivery_failures")}</div>
          <div className="admin-stat-sub">Failed, paid, or stuck delivering — tap to resend</div>
        </Link>
      </section>

      <DashboardCharts charts={data.charts} />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between border-b py-3">
            <CardTitle className="admin-card-title">Recent Users</CardTitle>
            <Link href="/users" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="admin-table-heavy-divider">
                <TableRow>
                  <TableHead className="admin-table-head">User</TableHead>
                  <TableHead className="admin-table-head">Phone</TableHead>
                  <TableHead className="admin-table-head">Status</TableHead>
                  <TableHead className="admin-table-head">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_users.length ? (
                  data.recent_users.map((u) => {
                    const badge =
                      u.is_blocked ? (
                        <Badge variant="dark">Blocked</Badge>
                      ) : u.is_active ? (
                        <Badge variant="white">Active</Badge>
                      ) : (
                        <Badge variant="gray">Inactive</Badge>
                      );

                    const uuid = String((u as unknown as { uuid?: string }).uuid ?? "");

                    return (
                      <TableRow key={uuid || String((u as unknown as { id?: number }).id ?? "")} className="hover:bg-muted/30">
                        <TableCell>
                          <Link
                            href={`/users/${encodeURIComponent(uuid)}`}
                            className="text-foreground font-medium hover:underline"
                          >
                            {u.name ?? "—"}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {u.phone_number ?? "—"}
                        </TableCell>
                        <TableCell>{badge}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {formatMonthDay(u.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="px-3.5 py-5 text-[12px] text-muted-foreground">
                      No users yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between border-b py-3">
            <CardTitle className="admin-card-title">Recent Threat Alerts</CardTitle>
            <Link href="/threat-alerts" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="admin-table-heavy-divider">
                <TableRow>
                  <TableHead className="admin-table-head">Type</TableHead>
                  <TableHead className="admin-table-head">User</TableHead>
                  <TableHead className="admin-table-head">Status</TableHead>
                  <TableHead className="admin-table-head">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_alerts.length ? (
                  data.recent_alerts.map((a) => {
                    const status = String(a.status ?? "").toLowerCase();
                    const badgeVariant =
                      status === "confirmed"
                        ? "black"
                        : status === "pending"
                          ? "mid"
                          : status === "sent"
                            ? "dark"
                            : "gray";

                    return (
                      <TableRow key={a.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Link
                            href={`/threat-alerts/${a.id}`}
                            className="text-foreground font-medium hover:underline"
                          >
                            {a.threat_type}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {a.user?.phone_number ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badgeVariant}>{a.status}</Badge>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {formatRelative(a.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="px-3.5 py-5 text-[12px] text-muted-foreground">
                      No alerts yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-none">
        <CardHeader className="flex flex-row items-center justify-between border-b py-3">
          <CardTitle className="admin-card-title">Recent App Support</CardTitle>
          <Link href="/support" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="admin-table-heavy-divider">
              <TableRow>
                <TableHead className="admin-table-head">Customer</TableHead>
                <TableHead className="admin-table-head">Last message</TableHead>
                <TableHead className="admin-table-head">Status</TableHead>
                <TableHead className="admin-table-head">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.recent_support ?? []).length ? (
                (data.recent_support ?? []).map((thread) => (
                  <SupportConversationRow
                    key={thread.conversation_uuid}
                    conversationUuid={thread.conversation_uuid}
                  >
                    <TableCell>
                      <div className="text-foreground font-medium">{thread.customer_name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {thread.customer_phone ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-[12px]">
                      {thread.last_message || "—"}
                    </TableCell>
                    <TableCell>
                      {thread.unread ? (
                        <Badge variant="dark">Unread</Badge>
                      ) : (
                        <Badge variant="gray">Read</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {formatRelative(thread.last_message_at)}
                    </TableCell>
                  </SupportConversationRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="px-3.5 py-5 text-[12px] text-muted-foreground">
                    No support messages yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </article>
  );
}
