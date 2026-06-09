"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { HubtelStatusBadge } from "@/components/hubtel/hubtel-status-badge";
import { isHubtelTransactionPending } from "@/lib/admin-api-envelope";

export type HubtelTestTransactionSnapshot = {
  id?: number;
  uuid?: string;
  client_reference?: string | null;
  status?: string | null;
  response_code?: string | null;
  external_transaction_id?: string | null;
  recipient?: string | null;
};

type HubtelTestFollowupProps = {
  title?: string;
  transaction: HubtelTestTransactionSnapshot | null;
  statusChecking: boolean;
  autoPolling?: boolean;
  onCheckStatus: () => void;
  hubtelStatusLabel?: string | null;
};

export function HubtelTestFollowup({
  title = "Last Hubtel transaction",
  transaction,
  statusChecking,
  autoPolling = false,
  onCheckStatus,
  hubtelStatusLabel,
}: HubtelTestFollowupProps): React.ReactElement | null {
  if (!transaction?.client_reference) {
    return null;
  }

  const pending = isHubtelTransactionPending(transaction);

  const detailHref =
    transaction.id != null
      ? `/services/hubtel/transactions/${transaction.id}`
      : transaction.uuid
        ? `/services/hubtel/transactions/${transaction.uuid}`
        : null;

  return (
    <section className="border-border bg-muted/30 space-y-2 rounded-md border p-3 text-sm">
      <p className="font-medium">{title}</p>
      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono">{transaction.client_reference}</span>
        {transaction.status ? <HubtelStatusBadge status={transaction.status} /> : null}
        {transaction.response_code ? (
          <span>Hubtel code: {transaction.response_code}</span>
        ) : null}
        {hubtelStatusLabel ? <span>Status: {hubtelStatusLabel}</span> : null}
        {autoPolling ? (
          <span className="text-primary inline-flex items-center gap-1">
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            Auto-checking every 5s…
          </span>
        ) : null}
      </div>
      {transaction.recipient ? (
        <p className="text-muted-foreground text-xs">
          Recipient sent to Hubtel: <span className="font-mono">{transaction.recipient}</span>
        </p>
      ) : null}
      {transaction.external_transaction_id ? (
        <p className="text-muted-foreground text-xs">
          Hubtel txn: <span className="font-mono">{transaction.external_transaction_id}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={statusChecking || autoPolling}
          aria-busy={statusChecking}
          onClick={onCheckStatus}
        >
          {statusChecking ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Checking…
            </>
          ) : (
            "Check Hubtel status"
          )}
        </Button>
        {detailHref ? (
          <Link
            href={detailHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Open transaction
          </Link>
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs">
        {pending ? (
          <>
            Response code <strong>0001</strong> means pending approval on the payer phone. Auto-polling
            stops once Hubtel reports <strong>Paid</strong> or a success message — no extra checks after
            that.
          </>
        ) : (
          <>
            Payment complete. Commission Services rows also update via{" "}
            <code className="text-xs">HUBTEL_CALLBACK_URL</code>; Direct MoMo uses Receive Money status.
          </>
        )}
      </p>
    </section>
  );
}
