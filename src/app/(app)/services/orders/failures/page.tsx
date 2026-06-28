"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  useGetServiceOrderFailuresQuery,
  useRedeliverServiceOrderMutation,
} from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTableBodySkeleton } from "@/components/admin/admin-loading-skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FailureOrder = {
  order_uuid: string;
  product?: string;
  product_code?: string;
  recipient?: string;
  recipient_name?: string | null;
  delivery_destination?: string | null;
  delivery_amount?: number;
  charged_amount?: number;
  status?: string;
  error_message?: string | null;
  can_redeliver?: boolean;
  payment_reference?: string | null;
  cs_client_reference?: string | null;
  updated_at?: string;
};

function statusBadgeVariant(status: string | undefined): "destructive" | "secondary" | "outline" {
  if (status === "failed") {
    return "destructive";
  }
  if (status === "delivering" || status === "paid") {
    return "secondary";
  }
  return "outline";
}

function formatMoney(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return value.toFixed(2);
}

export default function ServiceOrderFailuresPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [product, setProduct] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState({ product: "", status: "", search: "" });
  const [redeliveringUuid, setRedeliveringUuid] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useGetServiceOrderFailuresQuery({
    page,
    product: applied.product || undefined,
    status: applied.status || undefined,
    search: applied.search || undefined,
  });
  const [redeliver] = useRedeliverServiceOrderMutation();

  const block = data as { orders?: Paginated<FailureOrder> } | undefined;
  const list = block?.orders;

  async function handleRedeliver(order: FailureOrder): Promise<void> {
    if (!order.can_redeliver || !order.order_uuid) {
      return;
    }
    setRedeliveringUuid(order.order_uuid);
    try {
      const result = await redeliver(order.order_uuid).unwrap();
      const status = typeof result.status === "string" ? result.status : undefined;
      const errorMessage =
        typeof result.error_message === "string" ? result.error_message : undefined;
      if (status === "delivered") {
        toast.success(typeof result.message === "string" ? result.message : "Service delivered.");
      } else if (status === "failed") {
        toast.error(errorMessage ?? (typeof result.message === "string" ? result.message : "Delivery failed again."));
      } else {
        toast.message(typeof result.message === "string" ? result.message : "Delivery submitted — awaiting Hubtel callback.");
      }
      await refetch();
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "data" in error
          ? String((error as { data?: { message?: string } }).data?.message ?? "Redelivery failed.")
          : "Redelivery failed.";
      toast.error(message);
    } finally {
      setRedeliveringUuid(null);
    }
  }

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Link href="/balances" className={buttonVariants({ variant: "link", size: "sm" })}>
            Back to balances
          </Link>
          <AdminPageHeader
            title="Service delivery failures"
            subtitle="Paid orders that failed or are stuck before Hubtel Commission Services delivery completes. Resend uses the customer numbers stored on the order."
          />
        </div>
        <Link href="/services/hubtel" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Hubtel overview
        </Link>
      </header>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-2">
            <Label htmlFor="sof-product">Product</Label>
            <Input
              id="sof-product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="ecg, airtime, data…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sof-status">Status</Label>
            <Input
              id="sof-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="failed, paid, delivering"
            />
          </div>
          <div className="min-w-[12rem] flex-1 space-y-2">
            <Label htmlFor="sof-search">Search</Label>
            <Input
              id="sof-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="UUID, recipient, error, reference…"
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              setApplied({ product, status, search });
              setPage(1);
            }}
          >
            Apply
          </Button>
        </CardContent>
      </Card>

      {isError ? <p className="text-destructive text-sm">Could not load delivery failures.</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders needing attention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Deliver to</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <AdminTableBodySkeleton rows={8} cellWidths={["w-36", "w-20", "w-24", "w-16", "w-16", "w-32", "w-20"]} />
                ) : (list?.items ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground py-10 text-center text-sm">
                      No failed or stuck service orders right now.
                    </TableCell>
                  </TableRow>
                ) : (
                  (list?.items ?? []).map((order) => (
                    <TableRow key={order.order_uuid}>
                      <TableCell>
                        <div className="font-mono text-xs">{order.order_uuid}</div>
                        {order.payment_reference ? (
                          <div className="text-muted-foreground mt-1 font-mono text-[11px]">
                            pay {order.payment_reference}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{order.product ?? order.product_code ?? "—"}</div>
                        <div className="text-muted-foreground font-mono text-[11px]">
                          {order.recipient ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {order.delivery_destination ?? order.recipient ?? "—"}
                        {order.recipient_name ? (
                          <div className="text-muted-foreground font-sans text-[11px]">{order.recipient_name}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm">GHS {formatMoney(order.delivery_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(order.status)}>{order.status ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[16rem] text-xs text-muted-foreground">
                        {order.error_message ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!order.can_redeliver || redeliveringUuid === order.order_uuid}
                          onClick={() => void handleRedeliver(order)}
                        >
                          {redeliveringUuid === order.order_uuid ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="mr-2 h-4 w-4" />
                          )}
                          Resend
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoading ? (
            <PaginationControls className="mt-4" meta={list?.meta} page={page} onPageChange={setPage} />
          ) : null}
        </CardContent>
      </Card>
    </article>
  );
}
