"use client";

import Link from "next/link";
import { useGetHubtelSummaryQuery } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminTableBodySkeleton } from "@/components/admin/admin-loading-skeletons";
import { HubtelStatusBadge } from "@/components/hubtel/hubtel-status-badge";

export default function HubtelSummaryPage(): React.ReactElement {
  const { data, isLoading, isError } = useGetHubtelSummaryQuery();

  const recent = (data?.recentTransactions ?? []) as Record<string, unknown>[];

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <AdminPageHeader
          title="Hubtel Commission Services"
          subtitle="SMS · Airtime · Data Bundles · ECG · Ghana Water · DSTV · GOtv · StarTimes"
        />
        <div className="flex flex-wrap gap-2">
          <Link
            href="/balances"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Provider Balances
          </Link>
          <Link
            href="/services/hubtel/transactions"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            All transactions
          </Link>
          <Link
            href="/services/hubtel/tests"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Tools
          </Link>
        </div>
      </header>

      {isError ? (
        <p className="text-destructive text-sm">Could not load Hubtel summary.</p>
      ) : null}

      {isLoading || !data ? (
        <>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full max-w-2xl" />
          </div>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Card key={i} className="rounded-none p-3">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-2 h-3 w-28" />
              </Card>
            ))}
          </section>
          <Card className="rounded-none">
            <CardHeader className="flex flex-row items-center justify-between border-b py-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AdminTableBodySkeleton
                      rows={6}
                      cellWidths={["w-32", "w-24", "w-20", "w-16", "w-16", "w-14", "w-24"]}
                    />
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {data.isConfigured ? (
            <div className="rounded-md border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-900">
              Hubtel Commission Services is configured and ready.
              {!data.refundConfigured ? (
                <span className="text-muted-foreground">
                  {" "}
                  | <strong>Refund API:</strong> set <code>HUBTEL_COLLECTION_ACCOUNT_NUMBER</code> to enable.
                </span>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
              <strong>Hubtel not fully configured.</strong> Set{" "}
              <code>HUBTEL_API_ID</code>, <code>HUBTEL_API_KEY</code>, and{" "}
              <code>HUBTEL_DISBURSEMENT_ACCOUNT_NUMBER</code> in{" "}
              <code>seer-platform/.env</code>, then restart <strong>core</strong> (and proxy if
              you use port 4004).
            </div>
          )}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Airtime txns" value={String(data.airtimeCount ?? 0)} />
            <StatCard label="Data bundles" value={String(data.dataBundleCount ?? 0)} />
            <StatCard label="Utility txns" value={String(data.utilityCount ?? 0)} />
            <StatCard label="TV txns" value={String(data.tvCount ?? 0)} />
            <StatCard label="Successful" value={String(data.successCount ?? 0)} />
            <StatCard label="Pending" value={String(data.pendingCount ?? 0)} />
            <StatCard label="Failed" value={String(data.failedCount ?? 0)} />
          </section>

          <Card className="rounded-none">
            <CardHeader className="flex flex-row items-center justify-between border-b py-3">
              <CardTitle className="admin-card-title">Recent Transactions</CardTitle>
              <Link
                href="/services/hubtel/transactions"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.length ? (
                      recent.map((row) => {
                        const r = row as Record<string, unknown>;
                        const uuid = String(r.uuid ?? "");
                        const id = String(r.id ?? "");
                        const hrefKey = uuid || id;
                        const product = String(r.product ?? "");
                        const ref = String(r.client_reference ?? "");
                        const recipient = String(r.recipient ?? "—");
                        const amount = Number(r.amount ?? 0);
                        const commission = r.commission == null ? null : Number(r.commission);
                        const status = String(r.display_status ?? r.status ?? "");
                        const when = String(r.created_human ?? r.created_at ?? "—");

                        return (
                          <TableRow key={id} className="hover:bg-muted/30">
                            <TableCell className="max-w-[280px]">
                              <div className="flex flex-wrap items-center gap-2">
                                {product ? (
                                  <Badge variant="gray">{product.replaceAll("_", " ")}</Badge>
                                ) : null}
                                <Link
                                  href={`/services/hubtel/transactions/${encodeURIComponent(hrefKey)}`}
                                  className="font-mono text-[11px] text-primary hover:underline"
                                >
                                  {ref || `#${id}`}
                                </Link>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{String(r.service_label ?? "—")}</TableCell>
                            <TableCell className="font-mono text-xs">{recipient}</TableCell>
                            <TableCell className="text-right font-medium">
                              GHS {amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              {commission != null && Number.isFinite(commission)
                                ? `GHS ${commission.toFixed(4)}`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <HubtelStatusBadge status={status} />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                              {when}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                          No transactions yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </article>
  );
}

function StatCard({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <Card className="rounded-none p-3">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-muted-foreground mt-1 text-xs">{label}</div>
    </Card>
  );
}
