"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatAdminMutationError, readAdminField } from "@/lib/admin-api-envelope";
import { useRetryHubtelCommissionMutation } from "@/store/admin-api";

const COMMISSION_RETRY_PRODUCTS = new Set(["airtime", "data", "utility", "tv"]);

export function canRetryHubtelCommissionTransaction(
  tx: Record<string, unknown>,
  hasLinkedServiceOrder: boolean,
): boolean {
  if (hasLinkedServiceOrder) {
    return false;
  }
  if (String(tx.status ?? "").toLowerCase() !== "failed") {
    return false;
  }
  return COMMISSION_RETRY_PRODUCTS.has(String(tx.product ?? ""));
}

type HubtelCommissionRetryButtonProps = {
  transactionUuid: string;
  productLabel?: string | null;
  deliveryAmount?: number | null;
  size?: "sm" | "default";
};

function formatConfirmAmount(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) {
    return "the stored delivery amount";
  }
  return `GHS ${amount.toFixed(2)}`;
}

export function HubtelCommissionRetryButton({
  transactionUuid,
  productLabel,
  deliveryAmount,
  size = "default",
}: HubtelCommissionRetryButtonProps): React.ReactElement {
  const router = useRouter();
  const [retry, { isLoading }] = useRetryHubtelCommissionMutation();
  const [busy, setBusy] = useState(false);

  async function handleRetry(): Promise<void> {
    const serviceName = productLabel?.trim() || "this service";
    const confirmed = window.confirm(
      `Retry ${serviceName} delivery through Hubtel?\n\nThis charges ${formatConfirmAmount(deliveryAmount)} from your Hubtel disbursement balance and creates a new delivery attempt.`,
    );
    if (!confirmed) {
      return;
    }

    setBusy(true);
    try {
      const payload = await retry(transactionUuid).unwrap();
      const nextTx = readAdminField<Record<string, unknown>>(payload, "transaction");
      const nextUuid = typeof nextTx?.uuid === "string" ? nextTx.uuid : null;
      toast.success("Delivery retry submitted to Hubtel.");
      if (nextUuid && nextUuid !== transactionUuid) {
        router.push(`/services/hubtel/transactions/${nextUuid}`);
      }
    } catch (error: unknown) {
      toast.error(formatAdminMutationError(error));
    } finally {
      setBusy(false);
    }
  }

  const loading = busy || isLoading;

  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      disabled={loading}
      onClick={() => void handleRetry()}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RotateCcw className="mr-2 h-4 w-4" />
      )}
      Retry Hubtel delivery
    </Button>
  );
}
