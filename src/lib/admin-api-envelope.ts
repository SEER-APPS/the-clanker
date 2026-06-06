export function flattenApiData(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const nested = record.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return record;
}

/** Idempotent unwrap — safe after RTK `unwrap()` or on raw `{ success, data }` envelopes. */
export function unwrapAdminPayload(payload: unknown): Record<string, unknown> | null {
  return flattenApiData(payload);
}

export function readAdminField<T>(payload: unknown, field: string): T | undefined {
  const flat = unwrapAdminPayload(payload);
  if (!flat || !(field in flat)) {
    return undefined;
  }
  return flat[field] as T;
}

export function adminTransformResponse<T>(raw: unknown): T {
  const flat = flattenApiData(raw);
  return (flat ?? raw) as T;
}

export function formatAdminMutationError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Request failed.";
  }
  const record = error as {
    status?: number | string;
    error?: string;
    data?: unknown;
  };
  const flat = flattenApiData(record.data ?? record);
  const message = flat?.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }
  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }
  if (flat?.issues) {
    return "Validation failed. Check your inputs.";
  }
  if (record.status != null) {
    return `Request failed (HTTP ${String(record.status)}).`;
  }
  return "Request failed.";
}

export function extractMutationErrorPayload(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { message: "Request failed." };
  }
  const record = error as {
    status?: number | string;
    error?: string;
    data?: unknown;
  };
  const flat = flattenApiData(record.data ?? record);
  return {
    http_status: record.status ?? null,
    error: typeof record.error === "string" ? record.error : null,
    message: typeof flat?.message === "string" ? flat.message : null,
    ...(flat ?? {}),
  };
}

export function isPendingHubtelResponse(payload: unknown): boolean {
  const flat = flattenApiData(payload);
  if (!flat) {
    return false;
  }
  const hubtelBlock = flat.hubtel;
  const hubtelRecord =
    hubtelBlock && typeof hubtelBlock === "object" && !Array.isArray(hubtelBlock)
      ? (hubtelBlock as Record<string, unknown>)
      : null;
  const responseCode =
    flat.response_code ??
    hubtelRecord?.response_code ??
    flat.hubtel_response_code ??
    readAdminField<{ response_code?: string }>(payload, "transaction")?.response_code;
  if (responseCode === "0001") {
    return true;
  }
  if (flat.pending_customer_approval === true || hubtelRecord?.pending === true) {
    return true;
  }
  const transaction = flat.transaction;
  if (transaction && typeof transaction === "object" && !Array.isArray(transaction)) {
    const transactionRecord = transaction as Record<string, unknown>;
    if (transactionRecord.response_code === "0001") {
      return true;
    }
    const status = String(transactionRecord.status ?? "").toLowerCase();
    if (status === "pending" || status === "pending_payment") {
      return responseCode == null || responseCode === "0001";
    }
  }
  return false;
}

export function serializeApiPayloadForDisplay(payload: unknown): string {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export function pendingHubtelResponseHint(payload: unknown): string | null {
  if (!isPendingHubtelResponse(payload)) {
    return null;
  }
  return "Pending (0001) — Hubtel accepted the request. Waiting for payment or callback. This is not a failure.";
}

export function extractPayDirectResult(payload: unknown): {
  orderUuid: string | null;
  clientReference: string | null;
  pendingApproval: boolean;
  message: string | null;
  hubtelResponseCode: string | null;
} {
  const flat = flattenApiData(payload);
  if (!flat) {
    return {
      orderUuid: null,
      clientReference: null,
      pendingApproval: false,
      message: null,
      hubtelResponseCode: null,
    };
  }

  const hubtelBlock = flat.hubtel;
  const hubtelRecord =
    hubtelBlock && typeof hubtelBlock === "object" && !Array.isArray(hubtelBlock)
      ? (hubtelBlock as Record<string, unknown>)
      : null;

  return {
    orderUuid: typeof flat.order_uuid === "string" ? flat.order_uuid : null,
    clientReference: typeof flat.client_reference === "string" ? flat.client_reference : null,
    pendingApproval: flat.pending_customer_approval === true,
    message: typeof flat.message === "string" ? flat.message : null,
    hubtelResponseCode:
      typeof hubtelRecord?.response_code === "string"
        ? hubtelRecord.response_code
        : typeof flat.hubtel_response_code === "string"
          ? flat.hubtel_response_code
          : null,
  };
}

export type HubtelTransactionSnapshot = {
  id?: number;
  uuid?: string;
  client_reference?: string | null;
  status?: string | null;
  response_code?: string | null;
  external_transaction_id?: string | null;
  recipient?: string | null;
};

export function extractHubtelTransactionSnapshot(
  payload: unknown,
): HubtelTransactionSnapshot | null {
  const flat = flattenApiData(payload);
  const transaction = flat?.transaction;
  if (!transaction || typeof transaction !== "object" || Array.isArray(transaction)) {
    return null;
  }
  return transaction as HubtelTransactionSnapshot;
}

export function isHubtelTransactionPending(
  transaction: HubtelTransactionSnapshot | null | undefined,
): boolean {
  if (!transaction?.client_reference) {
    return false;
  }
  const status = transaction.status?.toLowerCase() ?? "";
  if (status === "success" || status === "failed" || status === "delivered") {
    return false;
  }
  if (transaction.response_code === "0000") {
    return false;
  }
  return (
    transaction.response_code === "0001" ||
    status === "pending" ||
    status === "pending_payment"
  );
}

export function extractHubtelStatusCheckResult(payload: unknown): {
  transaction: HubtelTransactionSnapshot | null;
  hubtelStatusLabel: string | null;
  hubtelMessage: string | null;
} {
  const flat = flattenApiData(payload);
  const hubtelBlock = flat?.hubtel;
  const hubtelRecord =
    hubtelBlock && typeof hubtelBlock === "object" && !Array.isArray(hubtelBlock)
      ? (hubtelBlock as Record<string, unknown>)
      : null;
  const nestedHubtelData = hubtelRecord?.data;
  const nestedStatus =
    nestedHubtelData &&
    typeof nestedHubtelData === "object" &&
    !Array.isArray(nestedHubtelData)
      ? (nestedHubtelData as Record<string, unknown>).status
      : null;
  const hubtelStatusLabel = String(
    nestedStatus ?? hubtelRecord?.status ?? hubtelRecord?.response_code ?? "",
  ).trim();
  const hubtelMessage =
    typeof hubtelRecord?.message === "string" ? hubtelRecord.message : null;

  return {
    transaction: extractHubtelTransactionSnapshot(payload),
    hubtelStatusLabel: hubtelStatusLabel || null,
    hubtelMessage,
  };
}

export function extractHubtelCommissionMeta(
  payload: unknown,
): { pending?: boolean; response_code?: string | null; message?: string } | null {
  const flat = flattenApiData(payload);
  const hubtel = flat?.hubtel;
  if (!hubtel || typeof hubtel !== "object" || Array.isArray(hubtel)) {
    return null;
  }
  const meta = hubtel as Record<string, unknown>;
  return {
    pending: meta.pending === true,
    response_code: typeof meta.response_code === "string" ? meta.response_code : null,
    message: typeof meta.message === "string" ? meta.message : undefined,
  };
}

export function extractOrderCheckoutFields(payload: unknown): {
  orderUuid: string | null;
  checkoutUrl: string | null;
  checkoutId: string | null;
  recipientName: string | null;
} {
  const flat = flattenApiData(payload);
  if (!flat) {
    return { orderUuid: null, checkoutUrl: null, checkoutId: null, recipientName: null };
  }

  const orderUuid = typeof flat.order_uuid === "string" ? flat.order_uuid : null;
  const direct =
    typeof flat.checkout_direct_url === "string" ? flat.checkout_direct_url : null;
  const normal = typeof flat.checkout_url === "string" ? flat.checkout_url : null;
  const checkoutUrl = direct ?? normal;

  let checkoutId = typeof flat.checkout_id === "string" ? flat.checkout_id : null;
  if (!checkoutId && checkoutUrl) {
    checkoutId = parseHubtelCheckoutIdFromUrl(checkoutUrl);
  }

  const recipientName =
    typeof flat.recipient_name === "string" && flat.recipient_name.trim()
      ? flat.recipient_name.trim()
      : null;

  return { orderUuid, checkoutUrl, checkoutId, recipientName };
}

function parseHubtelCheckoutIdFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const parts = parsedUrl.pathname.split("/").filter(Boolean);
    if (parts.length === 0) {
      return null;
    }
    if (parts[parts.length - 1] === "direct" && parts.length >= 2) {
      return parts[parts.length - 2] ?? null;
    }
    return parts[parts.length - 1] ?? null;
  } catch {
    return null;
  }
}
