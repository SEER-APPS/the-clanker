"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRedeliverServiceOrderMutation } from "@/store/admin-api";
import { canRedeliverServiceOrderStatus } from "@/lib/service-order-redeliver";

type ServiceOrderResendButtonProps = {
  orderUuid: string;
  status?: string | null;
  size?: "sm" | "default";
  onCompleted?: () => void | Promise<void>;
};

export function ServiceOrderResendButton({
  orderUuid,
  status,
  size = "sm",
  onCompleted,
}: ServiceOrderResendButtonProps): React.ReactElement | null {
  const [redeliver, { isLoading }] = useRedeliverServiceOrderMutation();
  const [busy, setBusy] = useState(false);

  if (!canRedeliverServiceOrderStatus(status)) {
    return null;
  }

  async function handleRedeliver(): Promise<void> {
    setBusy(true);
    try {
      const result = await redeliver(orderUuid).unwrap();
      const nextStatus = typeof result.status === "string" ? result.status : undefined;
      const errorMessage =
        typeof result.error_message === "string" ? result.error_message : undefined;
      if (nextStatus === "delivered") {
        toast.success(typeof result.message === "string" ? result.message : "Service delivered.");
      } else if (nextStatus === "failed") {
        toast.error(
          errorMessage ??
            (typeof result.message === "string" ? result.message : "Delivery failed again."),
        );
      } else {
        toast.message(
          typeof result.message === "string"
            ? result.message
            : "Delivery submitted — awaiting Hubtel callback.",
        );
      }
      await onCompleted?.();
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "data" in error
          ? String((error as { data?: { message?: string } }).data?.message ?? "Redelivery failed.")
          : "Redelivery failed.";
      toast.error(message);
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
      onClick={() => void handleRedeliver()}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RotateCcw className="mr-2 h-4 w-4" />
      )}
      Resend
    </Button>
  );
}
