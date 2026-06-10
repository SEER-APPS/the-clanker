import type { HubtelTestTransactionSnapshot } from "@/components/hubtel/hubtel-test-followup";
import {
  extractPayDirectResult,
  type PayDirectResult,
} from "@/lib/admin-api-envelope";

export type ApplyPayDirectResponseCallbacks = {
  setOrderUuid: (uuid: string | null) => void;
  setCheckoutOpen: (open: boolean) => void;
  setCheckoutUrl: (url: string | null) => void;
  setLastCsTransaction: (
    value:
      | HubtelTestTransactionSnapshot
      | null
      | ((prev: HubtelTestTransactionSnapshot | null) => HubtelTestTransactionSnapshot | null),
  ) => void;
  setHubtelStatusLabel: (label: string | null) => void;
  setTrackedOrderStatus: (status: string | null) => void;
};

function buildTransactionSnapshot(
  result: PayDirectResult,
  recipient: string,
): HubtelTestTransactionSnapshot | null {
  if (!result.clientReference) {
    return null;
  }

  return {
    client_reference: result.clientReference,
    status: result.paymentSucceeded ? "success" : "pending_payment",
    response_code: result.hubtelResponseCode,
    hubtel_payment_status: result.paymentSucceeded ? "Paid" : "Unpaid",
    recipient,
    external_transaction_id: result.hubtelTransactionId,
  };
}

function resolveHubtelStatusLabel(result: PayDirectResult): string | null {
  if (result.paymentSucceeded) {
    return "Paid";
  }
  if (result.pendingApproval || result.hubtelResponseCode === "0001") {
    return "Pending approval";
  }
  if (result.hubtelResponseCode) {
    return result.hubtelResponseCode;
  }
  return null;
}

export function applyPayDirectResponse(
  payload: unknown,
  recipient: string,
  callbacks: ApplyPayDirectResponseCallbacks,
): PayDirectResult {
  const result = extractPayDirectResult(payload);

  callbacks.setCheckoutUrl(null);

  if (result.orderUuid) {
    callbacks.setOrderUuid(result.orderUuid);
    callbacks.setCheckoutOpen(true);
  }

  if (result.orderStatus) {
    callbacks.setTrackedOrderStatus(result.orderStatus);
  }

  const snapshot = buildTransactionSnapshot(result, recipient);
  if (snapshot) {
    callbacks.setLastCsTransaction(snapshot);
  }

  callbacks.setHubtelStatusLabel(resolveHubtelStatusLabel(result));

  return result;
}

export function payDirectSuccessToast(
  result: PayDirectResult,
  pendingHint: string,
): string {
  if (result.paymentSucceeded && result.orderComplete) {
    return result.message ?? "Payment successful — order complete.";
  }
  if (result.paymentSucceeded) {
    return result.message ?? "Payment successful — delivering service.";
  }
  return (
    result.message ??
    (result.pendingApproval || result.hubtelResponseCode === "0001"
      ? pendingHint
      : "MoMo prompt sent. Approve on the payer phone.")
  );
}
