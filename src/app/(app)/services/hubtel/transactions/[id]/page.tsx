"use client";

import { use } from "react";
import Link from "next/link";
import {
  useGetHubtelTransactionQuery,
  useDeleteHubtelTransactionMutation,
  useArchiveHubtelTransactionMutation,
  useRefreshHubtelTransactionMutation,
} from "@/store/admin-api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatAdminMutationError } from "@/lib/admin-api-envelope";
import { Loader2 } from "lucide-react";
import { AdminDetailPageSkeleton } from "@/components/admin/admin-loading-skeletons";
import { HubtelTransactionDetailView } from "@/components/hubtel/hubtel-transaction-detail-view";
import {
  readLinkedServiceOrder,
  ServiceOrderResendButton,
} from "@/components/admin/service-order-resend-button";
import {
  canRetryHubtelCommissionTransaction,
  HubtelCommissionRetryButton,
} from "@/components/admin/hubtel-commission-retry-button";
import { canRedeliverServiceOrderStatus } from "@/lib/service-order-redeliver";
import { useAdminConfirm } from "@/hooks/use-admin-confirm";

export default function HubtelTransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  const { id: raw } = use(params);
  const { data, isLoading, isError, refetch } = useGetHubtelTransactionQuery(raw);
  const [remove, { isLoading: rmBusy }] = useDeleteHubtelTransactionMutation();
  const [archive, { isLoading: arBusy }] = useArchiveHubtelTransactionMutation();
  const [refresh, { isLoading: rfBusy }] = useRefreshHubtelTransactionMutation();
  const { confirm, dialog: confirmDialog } = useAdminConfirm();

  const tx = data?.transaction as Record<string, unknown> | undefined;
  const linkedOrder = tx ? readLinkedServiceOrder(tx) : null;
  const showResend =
    linkedOrder != null && canRedeliverServiceOrderStatus(linkedOrder.status);
  const showCommissionRetry =
    tx != null && canRetryHubtelCommissionTransaction(tx, linkedOrder != null);
  const deliveryAmount =
    linkedOrder?.deliveryAmount ??
    (tx?.amount != null && Number.isFinite(Number(tx.amount)) ? Number(tx.amount) : null);
  const productLabel =
    linkedOrder?.productLabel ??
    (typeof tx?.product_label === "string"
      ? tx.product_label
      : typeof tx?.product === "string"
        ? tx.product
        : null);

  async function onDelete(): Promise<void> {
    const confirmed = await confirm({
      title: "Delete transaction?",
      description: "Delete this transaction? This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) {
      return;
    }
    try {
      await remove(raw).unwrap();
      toast.success("Deleted.");
      window.location.href = "/services/hubtel/transactions";
    } catch (err: unknown) {
      toast.error(formatAdminMutationError(err));
    }
  }

  async function onArchive(): Promise<void> {
    try {
      await archive(raw).unwrap();
      toast.success("Archived.");
      void refetch();
    } catch (err: unknown) {
      toast.error(formatAdminMutationError(err));
    }
  }

  async function onRefresh(): Promise<void> {
    try {
      await refresh(raw).unwrap();
      toast.success("Refresh requested.");
      void refetch();
    } catch (err: unknown) {
      toast.error(formatAdminMutationError(err));
    }
  }

  if (isLoading) {
    return <AdminDetailPageSkeleton />;
  }
  if (isError || !tx) {
    return <p className="text-destructive text-sm">Not found.</p>;
  }

  return (
    <article className="space-y-6">
      {confirmDialog}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/services/hubtel/transactions"
            className="text-muted-foreground text-sm hover:underline"
          >
            Back to list
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Transaction {String(tx.uuid ?? `#${tx.id}`)}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {showResend && linkedOrder ? (
            <ServiceOrderResendButton
              orderUuid={linkedOrder.orderUuid}
              status={linkedOrder.status}
              productLabel={productLabel}
              deliveryAmount={deliveryAmount}
              size="default"
              onCompleted={() => {
                void refetch();
              }}
            />
          ) : null}
          {showCommissionRetry ? (
            <HubtelCommissionRetryButton
              transactionUuid={raw}
              productLabel={productLabel}
              deliveryAmount={deliveryAmount}
              size="default"
            />
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={rfBusy}
            aria-busy={rfBusy}
            onClick={() => {
              void onRefresh();
            }}
          >
            {rfBusy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Refreshing…
              </>
            ) : (
              "Refresh status"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={arBusy}
            aria-busy={arBusy}
            onClick={() => {
              void onArchive();
            }}
          >
            {arBusy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Archiving…
              </>
            ) : (
              "Archive"
            )}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={rmBusy}
            aria-busy={rmBusy}
            onClick={() => {
              void onDelete();
            }}
          >
            {rmBusy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </header>
      {!showResend && !showCommissionRetry && String(tx.status ?? "").toLowerCase() === "failed" ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          {linkedOrder ? (
            <p>
              This transaction is linked to a customer order, but its status (
              <span className="font-mono">{String(linkedOrder.status ?? "unknown")}</span>) cannot be
              resent from here. Check the{" "}
              <Link href="/services/orders/failures" className="underline">
                delivery queue
              </Link>{" "}
              or contact support if delivery still looks wrong.
            </p>
          ) : (
            <p>
              This Hubtel row has no linked customer service order (common for admin lab tests with{" "}
              <span className="font-mono">admin-airtime</span> /{" "}
              <span className="font-mono">admin-utility</span> references). Customer purchases use
              a linked order and show <strong>Resend delivery</strong> when retry is allowed.
            </p>
          )}
        </div>
      ) : null}
      <HubtelTransactionDetailView tx={tx} />
    </article>
  );
}
