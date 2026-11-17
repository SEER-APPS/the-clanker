"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminConfirm } from "@/hooks/use-admin-confirm";
import { useRedeliverServiceOrderMutation } from "@/store/admin-api";
import {
  canRedeliverServiceOrderStatus,
  readCustomerPhoneFromOrderMetadata,
  serviceOrderAcceptsDeliveryPhone,
} from "@/lib/service-order-redeliver";

type ServiceOrderResendButtonProps = {
  orderUuid: string;
  status?: string | null;
  product?: string | null;
  productLabel?: string | null;
  deliveryAmount?: number | null;
  customerPhone?: string | null;
  size?: "sm" | "default";
  onCompleted?: () => void | Promise<void>;
};

function formatConfirmAmount(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) {
    return "the stored delivery amount";
  }
  return `GHS ${amount.toFixed(2)}`;
}

export function ServiceOrderResendButton({
  orderUuid,
  status,
  product,
  productLabel,
  deliveryAmount,
  customerPhone,
  size = "sm",
  onCompleted,
}: ServiceOrderResendButtonProps): React.ReactElement | null {
  const [redeliver, { isLoading }] = useRedeliverServiceOrderMutation();
  const [busy, setBusy] = useState(false);
  const [deliveryPhone, setDeliveryPhone] = useState(customerPhone ?? "");
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const showPhoneField = serviceOrderAcceptsDeliveryPhone(product);

  if (!canRedeliverServiceOrderStatus(status)) {
    return null;
  }

  async function handleRedeliver(): Promise<void> {
    const serviceName = productLabel?.trim() || "this service";
    const phoneNote = showPhoneField
      ? `\n\nDelivery phone: ${deliveryPhone.trim() || "the number stored on the order"}.`
      : "";
    const confirmed = await confirm({
      title: "Resend delivery?",
      description: `Resend ${serviceName} to the customer?\n\nThis charges ${formatConfirmAmount(deliveryAmount)} from your Hubtel disbursement balance. Only continue if you have verified this order should be delivered again.${phoneNote}`,
      confirmLabel: "Resend delivery",
    });
    if (!confirmed) {
      return;
    }

    setBusy(true);
    try {
      const result = await redeliver({
        uuid: orderUuid,
        delivery_phone: showPhoneField ? deliveryPhone.trim() || undefined : undefined,
      }).unwrap();
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
    <>
      {confirmDialog}
      {showPhoneField ? (
        <div className="flex min-w-[16rem] flex-col gap-1">
          <Label htmlFor={`delivery-phone-${orderUuid}`} className="text-muted-foreground text-xs">
            Delivery phone
          </Label>
          <Input
            id={`delivery-phone-${orderUuid}`}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="ECG / customer mobile"
            value={deliveryPhone}
            disabled={loading}
            onChange={(event) => setDeliveryPhone(event.target.value)}
          />
        </div>
      ) : null}
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
      Resend delivery
    </Button>
    </>
  );
}

export function readLinkedServiceOrder(
  tx: Record<string, unknown>,
): {
  orderUuid: string;
  status: string | null;
  product: string | null;
  productLabel: string | null;
  deliveryAmount: number | null;
  customerPhone: string | null;
} | null {
  const orderUuid =
    typeof tx.service_order_uuid === "string" && tx.service_order_uuid.trim() !== ""
      ? tx.service_order_uuid
      : null;
  if (!orderUuid) {
    return null;
  }
  const status =
    typeof tx.service_order_status === "string" ? tx.service_order_status : null;
  const product =
    typeof tx.service_order_product === "string"
      ? tx.service_order_product
      : typeof tx.product === "string"
        ? tx.product
        : null;
  const productLabel =
    typeof tx.product === "string"
      ? tx.product
      : typeof tx.service_type === "string"
        ? tx.service_type
        : null;
  const amountRaw = tx.service_order_delivery_amount ?? tx.delivery_amount;
  const deliveryAmount =
    amountRaw != null && amountRaw !== "" && Number.isFinite(Number(amountRaw))
      ? Number(amountRaw)
      : null;
  return {
    orderUuid,
    status,
    product,
    productLabel,
    deliveryAmount,
    customerPhone: readCustomerPhoneFromOrderMetadata(tx.service_order_metadata),
  };
}
