"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useGetRecurringSubscriptionsQuery } from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminTableBodySkeleton } from "@/components/admin/admin-loading-skeletons";
import { RecurringStatusBadge } from "@/components/hubtel/recurring-status-badge";

const PAYMENT_INTERVAL_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

const CHANNEL_LABELS: Record<string, string> = {
  mtn_gh_rec: "MTN GH",
  vodafone_gh_rec: "Vodafone GH",
};

export default function RecurringSubscriptionsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [status, setStatus] = useState("");
  const [product, setProduct] = useState("");
  const [applied, setApplied] = useState({ status: "", product: "" });

  const queryArgs = useMemo(
    () => ({
      page,
      per_page: perPage,
      status: applied.status || undefined,
      product: applied.product || undefined,
    }),
    [page, perPage, applied],
  );

  const { data, isLoading, isError } = useGetRecurringSubscriptionsQuery(queryArgs);

  const wrap = (data as { subscriptions?: Paginated<Record<string, unknown>> } | undefined)
    ?.subscriptions;
  const rows = wrap?.items ?? [];

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/services/hubtel" className="text-muted-foreground text-sm hover:underline">
            Back to Hubtel
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Recurring Payments</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Scheduled service subscriptions billed on a recurring interval. Open a subscription to
            review its charge history.
          </p>
        </div>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:flex-wrap md:items-end">
          <div className="space-y-2">
            <Label htmlFor="rec-product">Product</Label>
            <Input
              id="rec-product"
              value={product}
              onChange={(e) => {
                setProduct(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rec-status">Status</Label>
            <Input
              id="rec-status"
              value={status}
              placeholder="active, pending_verification…"
              onChange={(e) => {
                setStatus(e.target.value);
              }}
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              setApplied({ status, product });
              setPage(1);
            }}
          >
            Apply filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="text-destructive text-sm">Could not load recurring subscriptions.</p>
          ) : null}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <AdminTableBodySkeleton
                    rows={10}
                    cellWidths={["w-28", "w-20", "w-16", "w-16", "w-20", "w-20", "w-24"]}
                  />
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground py-10 text-center text-sm">
                      No recurring subscriptions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const r = row as Record<string, unknown>;
                    const uuid = String(r.subscription_uuid ?? "");
                    const interval = String(r.payment_interval ?? "");
                    const channel = String(r.channel ?? "");
                    const amount = r.recurring_amount;
                    return (
                      <TableRow key={uuid}>
                        <TableCell className="font-mono text-xs">
                          <Link
                            href={`/services/recurring/${encodeURIComponent(uuid)}`}
                            className="text-primary hover:underline"
                          >
                            {String(r.recipient_name ?? r.recipient ?? uuid)}
                          </Link>
                          {r.recipient_name ? (
                            <div className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                              {String(r.recipient ?? "—")}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>{String(r.product ?? "—")}</TableCell>
                        <TableCell className="text-right font-medium">
                          {typeof amount === "number"
                            ? `${String(r.currency ?? "GHS")} ${amount.toFixed(2)}`
                            : String(amount ?? "—")}
                        </TableCell>
                        <TableCell>{PAYMENT_INTERVAL_LABELS[interval] ?? (interval || "—")}</TableCell>
                        <TableCell>{CHANNEL_LABELS[channel] ?? (channel || "—")}</TableCell>
                        <TableCell>
                          <RecurringStatusBadge status={String(r.status ?? "")} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {formatRecurringDate(String(r.created_at ?? ""))}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoading ? (
            <PaginationControls
              className="mt-4"
              meta={wrap?.meta}
              page={page}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(next) => {
                setPerPage(next);
                setPage(1);
              }}
            />
          ) : null}
        </CardContent>
      </Card>
    </article>
  );
}

function formatRecurringDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
