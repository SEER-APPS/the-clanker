"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HubtelStatusBadge } from "@/components/hubtel/hubtel-status-badge";

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
  onCheckStatus: () => void;
  hubtelStatusLabel?: string | null;
};

export function HubtelTestFollowup({
  title = "Last Hubtel transaction",
  transaction,
  statusChecking,
  onCheckStatus,
  hubtelStatusLabel,
}: HubtelTestFollowupProps): React.ReactElement | null {
  if (!transaction?.client_reference) {
    return null;
  }

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
        {hubtelStatusLabel ? <span>Status API: {hubtelStatusLabel}</span> : null}
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
          disabled={statusChecking}
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
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={detailHref}>Open transaction</Link>
          </Button>
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs">
        Response code <strong>0001</strong> means pending — approve delivery via Hubtel callback or run status
        check after a minute.
      </p>
    </section>
  );
}
