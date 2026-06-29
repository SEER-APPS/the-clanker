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

  const tx = data?.transaction as Record<string, unknown> | undefined;
  const linkedOrder = tx ? readLinkedServiceOrder(tx) : null;

  async function onDelete(): Promise<void> {
    if (!window.confirm("Delete this transaction?")) {
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
          {linkedOrder ? (
            <ServiceOrderResendButton
              orderUuid={linkedOrder.orderUuid}
              status={linkedOrder.status}
              productLabel={linkedOrder.productLabel}
              deliveryAmount={linkedOrder.deliveryAmount}
              size="default"
              onCompleted={() => {
                void refetch();
              }}
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
      <HubtelTransactionDetailView tx={tx} />
    </article>
  );
}
