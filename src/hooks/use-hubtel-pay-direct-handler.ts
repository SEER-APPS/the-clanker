"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import type { HubtelTestTransactionSnapshot } from "@/components/hubtel/hubtel-test-followup";
import { formatAdminMutationError as failMsg } from "@/lib/admin-api-envelope";
import {
  applyPayDirectResponse,
  payDirectSuccessToast,
  type ApplyPayDirectResponseCallbacks,
} from "@/lib/hubtel-pay-direct";
import { useServiceOrderPayDirectMutation } from "@/store/admin-api";

type UseHubtelPayDirectHandlerOptions = ApplyPayDirectResponseCallbacks;

export function useHubtelPayDirectHandler(
  callbacks: UseHubtelPayDirectHandlerOptions,
): {
  payDirectBusy: boolean;
  runPayDirect: (
    body: Record<string, unknown>,
    recipient: string,
    pendingHint: string,
  ) => Promise<HubtelTestTransactionSnapshot | null>;
} {
  const [payDirect, { isLoading: payDirectBusy }] = useServiceOrderPayDirectMutation();

  const runPayDirect = useCallback(
    async (
      body: Record<string, unknown>,
      recipient: string,
      pendingHint: string,
    ): Promise<HubtelTestTransactionSnapshot | null> => {
      try {
        const payload = await payDirect(body).unwrap();
        const result = applyPayDirectResponse(payload, recipient, callbacks);
        toast.success(payDirectSuccessToast(result, pendingHint));
        return result.clientReference
          ? {
              client_reference: result.clientReference,
              status: result.paymentSucceeded ? "success" : "pending_payment",
              response_code: result.hubtelResponseCode,
              hubtel_payment_status: result.paymentSucceeded ? "Paid" : "Unpaid",
              recipient,
              external_transaction_id: result.hubtelTransactionId,
            }
          : null;
      } catch (error) {
        const errorPayload =
          error && typeof error === "object" && "data" in error
            ? (error as { data: unknown }).data
            : error;
        applyPayDirectResponse(errorPayload, recipient, callbacks);
        toast.error(failMsg(error));
        return null;
      }
    },
    [callbacks, payDirect],
  );

  return { payDirectBusy, runPayDirect };
}
