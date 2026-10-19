"use client";

import Link from "next/link";
import { useGetRecurringFundingQuery } from "@/store/admin-api";

function ghs(value: number | null | undefined): string {
  return value == null ? "—" : `GHS ${value.toFixed(2)}`;
}

function formatWhen(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Recurring debits settle into Hubtel collection 1–24h after the customer is
 * charged, so deliveries can wait on the disbursement float. Renders nothing
 * when nothing is waiting and the next 24h are covered.
 */
export function RecurringFundingAlert({
  showItems = false,
}: {
  showItems?: boolean;
}): React.ReactElement | null {
  const { data } = useGetRecurringFundingQuery(undefined, { pollingInterval: 5 * 60 * 1000 });

  if (!data || (data.awaiting_count === 0 && data.shortfall_ghs <= 0)) {
    return null;
  }

  const waiting = data.awaiting_count > 0;

  return (
    <section
      role="alert"
      className="border-destructive/40 bg-destructive/10 dark:bg-destructive/20 space-y-3 rounded-lg border p-4 text-sm"
    >
      <div className="space-y-1">
        <p className="text-destructive font-semibold">
          {waiting
            ? `${data.awaiting_count} recurring ${data.awaiting_count === 1 ? "delivery is" : "deliveries are"} waiting for funds (${ghs(data.awaiting_ghs)})`
            : `Recurring float is short by ${ghs(data.shortfall_ghs)} for the next 24 hours`}
        </p>
        <p className="text-muted-foreground">
          {waiting
            ? `Customers have already been debited. Delivery retries every hour for up to ${data.wait_window_hours}h while Hubtel settles the debits into collection; after that the order fails and needs a manual redeliver.`
            : "Recurring debits take 1–24h to settle into collection, so the disbursement account has to cover upcoming deliveries."}{" "}
          Fund the Hubtel disbursement (prepaid) account to clear this.
        </p>
      </div>

      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground text-xs">Disbursement</dt>
          <dd className="font-medium">{ghs(data.disbursement_ghs)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Collection</dt>
          <dd className="font-medium">{ghs(data.collection_ghs)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Expected next 24h</dt>
          <dd className="font-medium">
            {ghs(data.forecast_24h_ghs)} ({data.forecast_24h_count})
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Shortfall</dt>
          <dd className="text-destructive font-medium">{ghs(data.shortfall_ghs)}</dd>
        </div>
      </dl>

      {showItems && data.items.length > 0 ? (
        <ul className="divide-border divide-y">
          {data.items.map((item) => (
            <li key={item.charge_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <Link
                href={`/services/recurring/${encodeURIComponent(item.subscription_uuid)}`}
                className="hover:underline"
              >
                {item.product} → {item.recipient}
              </Link>
              <span className="text-muted-foreground text-xs">
                {ghs(item.amount_ghs)} · waiting since {formatWhen(item.awaiting_funds_since)} ·{" "}
                {item.funds_retry_count} {item.funds_retry_count === 1 ? "retry" : "retries"} · next{" "}
                {formatWhen(item.next_funds_retry_at)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/balances" className="font-medium underline-offset-4 hover:underline">
          Open balances
        </Link>
        {!showItems ? (
          <Link href="/services/recurring" className="font-medium underline-offset-4 hover:underline">
            View recurring payments
          </Link>
        ) : null}
      </div>
    </section>
  );
}
