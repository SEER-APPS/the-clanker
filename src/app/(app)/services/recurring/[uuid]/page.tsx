"use client";

import { use } from "react";
import Link from "next/link";
import { useGetRecurringSubscriptionQuery } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminDetailPageSkeleton } from "@/components/admin/admin-loading-skeletons";
import { RecurringStatusBadge } from "@/components/hubtel/recurring-status-badge";
import { HubtelDetailSection, type DetailField } from "@/components/hubtel/hubtel-detail-section";

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

function display(value: unknown): string {
  if (value == null || value === "") {
    return "—";
  }
  return String(value);
}

function displayAmount(value: unknown, currency: unknown): string {
  if (typeof value !== "number") {
    return "—";
  }
  return `${String(currency ?? "GHS")} ${value.toFixed(2)}`;
}

function chargeStatusBadge(status: unknown): React.ReactElement {
  const s = String(status ?? "").toLowerCase();
  if (s === "paid") {
    return <Badge variant="white">Paid</Badge>;
  }
  if (s === "failed") {
    return <Badge variant="dark">Failed</Badge>;
  }
  return <Badge variant="gray">{display(status)}</Badge>;
}

function formatDate(iso: unknown): string {
  const raw = String(iso ?? "");
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function RecurringSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}): React.ReactElement {
  const { uuid: raw } = use(params);
  const { data, isLoading, isError } = useGetRecurringSubscriptionQuery(raw);

  const sub = (data?.subscription ?? data) as Record<string, unknown> | undefined;
  const charges = Array.isArray(sub?.charges) ? (sub.charges as Record<string, unknown>[]) : [];

  if (isLoading) {
    return <AdminDetailPageSkeleton />;
  }
  if (isError || !sub) {
    return <p className="text-destructive text-sm">Not found.</p>;
  }

  const interval = String(sub.payment_interval ?? "");
  const channel = String(sub.channel ?? "");
  const status = String(sub.status ?? "");

  const summaryFields: DetailField[] = [
    { label: "Product", value: display(sub.product) },
    { label: "Network", value: display(sub.network) },
    { label: "Service type", value: display(sub.service_type) },
    { label: "Data bundle", value: display(sub.data_bundle_id), mono: true },
    { label: "Payment interval", value: PAYMENT_INTERVAL_LABELS[interval] ?? display(interval) },
    { label: "Channel", value: CHANNEL_LABELS[channel] ?? display(channel) },
    { label: "Currency", value: display(sub.currency) },
  ];

  const recipientFields: DetailField[] = [
    { label: "Recipient", value: display(sub.recipient), mono: true },
    { label: "Recipient name", value: display(sub.recipient_name) },
    { label: "Customer mobile number", value: display(sub.customer_mobile_number), mono: true },
  ];

  const billingFields: DetailField[] = [
    { label: "Recurring amount", value: displayAmount(sub.recurring_amount, sub.currency) },
    { label: "Charged amount", value: displayAmount(sub.charged_amount, sub.currency) },
    { label: "Markup", value: display(sub.markup) },
  ];

  const scheduleFields: DetailField[] = [
    { label: "Start time", value: formatDate(sub.start_time) },
    { label: "Order date", value: formatDate(sub.order_date) },
    { label: "Invoice end date", value: formatDate(sub.invoice_end_date) },
    { label: "Cancelled at", value: formatDate(sub.cancelled_at) },
    { label: "Created", value: formatDate(sub.created_at) },
    { label: "Updated", value: formatDate(sub.updated_at) },
  ];

  const referenceFields: DetailField[] = [
    { label: "UUID", value: display(sub.subscription_uuid), mono: true },
    { label: "Hubtel recurring invoice ID", value: display(sub.hubtel_recurring_invoice_id), mono: true },
  ];

  const metadata =
    sub.metadata && typeof sub.metadata === "object" && !Array.isArray(sub.metadata)
      ? (sub.metadata as Record<string, unknown>)
      : null;
  const hubtelCreateFailure = metadata?.hubtel_create_failure;

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/services/recurring" className="text-muted-foreground text-sm hover:underline">
            Back to list
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Recurring subscription {display(sub.subscription_uuid)}
          </h1>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle className="text-lg">{display(sub.product)}</CardTitle>
            <p className="text-muted-foreground mt-1 font-mono text-xs">{display(sub.recipient)}</p>
          </div>
          <RecurringStatusBadge status={status} />
        </CardHeader>
        <CardContent className="space-y-3">
          {sub.error_message ? (
            <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
              Error: <span className="font-mono">{String(sub.error_message)}</span>
            </p>
          ) : null}
          <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
            <span>Created {formatDate(sub.created_at)}</span>
            <span>Updated {formatDate(sub.updated_at)}</span>
          </div>
        </CardContent>
      </Card>

      <HubtelDetailSection title="Summary" fields={summaryFields} />
      <HubtelDetailSection title="Recipient" fields={recipientFields} />
      <HubtelDetailSection title="Billing" fields={billingFields} />
      <HubtelDetailSection title="Schedule" fields={scheduleFields} />
      <HubtelDetailSection title="References" fields={referenceFields} />

      {hubtelCreateFailure != null ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hubtel setup failure</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3 text-sm">
              Stored when create-invoice was rejected before an OTP could be sent.
            </p>
            <pre className="bg-muted max-h-[320px] overflow-auto rounded-md p-3 font-mono text-xs">
              {JSON.stringify(hubtelCreateFailure, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Charge history</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount charged</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Service order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-10 text-center text-sm">
                      No charges recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  charges.map((charge) => {
                    const chargeId = display(charge.id);
                    const serviceOrder = charge.service_order as
                      | { order_uuid?: string; status?: string }
                      | undefined;
                    const serviceOrderUuid =
                      serviceOrder?.order_uuid ??
                      (charge.service_order_id != null ? String(charge.service_order_id) : null);
                    return (
                      <TableRow key={chargeId}>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {formatDate(charge.created_at)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {displayAmount(charge.amount_charged, sub.currency)}
                        </TableCell>
                        <TableCell>
                          {chargeStatusBadge(charge.status)}
                          {charge.awaiting_funds === true ? (
                            <Badge variant="dark" className="ml-1">
                              Awaiting funds · {display(charge.funds_retry_count)} retries
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="max-w-[16rem] text-xs text-muted-foreground">
                          {display(charge.error_message)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {serviceOrderUuid ? (
                            <div className="flex items-center gap-2">
                              <span>{serviceOrderUuid}</span>
                              {serviceOrder?.status ? (
                                <Badge variant="gray">{serviceOrder.status}</Badge>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
