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
  if (error instanceof Error) {
    return error.message.trim() || "Request failed.";
  }
  if (!error || typeof error !== "object") {
    return "Request failed.";
  }
  const record = error as {
    status?: number | string;
    error?: string;
    data?: unknown;
    message?: string;
  };

  if (record.status === "FETCH_ERROR" || record.status === "TIMEOUT_ERROR") {
    const networkPayload = flattenApiData(record.data);
    if (typeof networkPayload?.message === "string" && networkPayload.message.trim()) {
      return networkPayload.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
    return "Network error — could not reach the server.";
  }

  const envelope = record.data;
  if (envelope && typeof envelope === "object" && !Array.isArray(envelope)) {
    const envRecord = envelope as Record<string, unknown>;
    if (typeof envRecord.message === "string" && envRecord.message.trim()) {
      return envRecord.message;
    }
    if (envRecord.issues) {
      return formatValidationIssues(envRecord.issues);
    }
  }

  const flat = flattenApiData(record.data ?? record);
  const nestedMessage = flat?.message;
  if (typeof nestedMessage === "string" && nestedMessage.trim()) {
    return nestedMessage;
  }
  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }
  if (flat?.issues) {
    return formatValidationIssues(flat.issues);
  }
  if (record.status != null && record.status !== "CUSTOM_ERROR") {
    return `Request failed (HTTP ${String(record.status)}).`;
  }
  return "Request failed.";
}

function formatValidationIssues(issues: unknown): string {
  if (!issues || typeof issues !== "object") {
    return "Validation failed. Check your inputs.";
  }
  const record = issues as {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
  const formErrors = record.formErrors ?? [];
  if (formErrors.length > 0) {
    return formErrors.join(" ");
  }
  const fieldMessages = Object.entries(record.fieldErrors ?? {}).flatMap(
    ([field, messages]) => (messages ?? []).map((message) => `${field}: ${message}`),
  );
  if (fieldMessages.length > 0) {
    return fieldMessages.join("; ");
  }
  return "Validation failed. Check your inputs.";
}

export type PayDirectResult = {
  orderUuid: string | null;
  clientReference: string | null;
  orderStatus: string | null;
  pendingApproval: boolean;
  message: string | null;
  hubtelResponseCode: string | null;
  hubtelTransactionId: string | null;
  paymentSucceeded: boolean;
  orderComplete: boolean;
  needsPaymentPolling: boolean;
  needsOrderPolling: boolean;
  meterNumber: string | null;
};

function hubtelMessageIndicatesSuccess(message: string | null | undefined): boolean {
  if (!message?.trim()) {
    return false;
  }
  const lower = message.trim().toLowerCase();
  return (
    lower.includes("successful") ||
    lower.includes("completed") ||
    lower.includes("delivered") ||
    lower === "paid"
  );
}

function readOrderMetadataField(payload: Record<string, unknown>, key: string): string | null {
  const metadata = payload.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, unknown>)[key];
  if (value == null) {
    return null;
  }
  const text = String(value).trim();
  return text || null;
}

export function extractPayDirectResult(payload: unknown): PayDirectResult {
  let envelopeMessage: string | null = null;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const topLevel = payload as Record<string, unknown>;
    if (typeof topLevel.message === "string" && topLevel.message.trim()) {
      envelopeMessage = topLevel.message;
    }
  }

  const empty: PayDirectResult = {
    orderUuid: null,
    clientReference: null,
    orderStatus: null,
    pendingApproval: false,
    message: envelopeMessage,
    hubtelResponseCode: null,
    hubtelTransactionId: null,
    paymentSucceeded: false,
    orderComplete: false,
    needsPaymentPolling: false,
    needsOrderPolling: false,
    meterNumber: null,
  };

  const flat = flattenApiData(payload);
  if (!flat) {
    return empty;
  }

  const hubtelBlock = flat.hubtel;
  const hubtelRecord =
    hubtelBlock && typeof hubtelBlock === "object" && !Array.isArray(hubtelBlock)
      ? (hubtelBlock as Record<string, unknown>)
      : null;

  const nestedMessage = typeof flat.message === "string" ? flat.message : null;
  const hubtelMessage =
    typeof hubtelRecord?.message === "string" ? hubtelRecord.message : null;
  const message = nestedMessage ?? hubtelMessage ?? envelopeMessage;

  const orderUuid = typeof flat.order_uuid === "string" ? flat.order_uuid : null;
  const clientReference =
    typeof flat.client_reference === "string" ? flat.client_reference : null;
  const orderStatus = typeof flat.status === "string" ? flat.status : null;
  const pendingApproval =
    flat.pending_customer_approval === true || hubtelRecord?.pending === true;
  const hubtelResponseCode =
    typeof hubtelRecord?.response_code === "string"
      ? hubtelRecord.response_code
      : typeof flat.hubtel_response_code === "string"
        ? flat.hubtel_response_code
        : null;
  const hubtelTransactionId =
    typeof flat.hubtel_transaction_id === "string" ? flat.hubtel_transaction_id : null;

  const paymentSucceeded =
    !pendingApproval &&
    (hubtelResponseCode === "0000" || hubtelMessageIndicatesSuccess(message));
  const orderComplete =
    isServiceOrderTerminal(orderStatus) ||
    orderStatus === "paid" ||
    orderStatus === "delivering";
  const needsPaymentPolling = Boolean(clientReference) && !paymentSucceeded;
  const needsOrderPolling = Boolean(orderUuid) && !isServiceOrderTerminal(orderStatus);

  const meterNumber =
    readOrderMetadataField(flat, "meter_number") ?? readOrderMetadataField(flat, "meter");

  return {
    orderUuid,
    clientReference,
    orderStatus,
    pendingApproval,
    message,
    hubtelResponseCode,
    hubtelTransactionId,
    paymentSucceeded,
    orderComplete,
    needsPaymentPolling,
    needsOrderPolling,
    meterNumber,
  };
}

export function readServiceOrderMeter(order: unknown): string | null {
  if (!order || typeof order !== "object" || Array.isArray(order)) {
    return null;
  }
  const record = order as Record<string, unknown>;
  return (
    readOrderMetadataField(record, "meter_number") ?? readOrderMetadataField(record, "meter")
  );
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

export type HubtelTxnPaymentState = "paid" | "failed" | "pending" | "unknown";

/** Mirrors core `resolveHubtelTxnPaymentState` for Receive Money / checkout status checks. */
export function resolveHubtelTxnPaymentStateFromCheck(payload: unknown): HubtelTxnPaymentState {
  const flat = flattenApiData(payload);
  const hubtelBlock = flat?.hubtel;
  if (!hubtelBlock || typeof hubtelBlock !== "object" || Array.isArray(hubtelBlock)) {
    return "unknown";
  }
  const statusPayload = hubtelBlock as Record<string, unknown>;
  const responseCode = String(
    statusPayload.responseCode ?? statusPayload.response_code ?? "",
  ).trim();

  const data = (statusPayload.data ?? statusPayload.Data) as
    | Record<string, unknown>
    | undefined;
  const hubtelStatus = data
    ? String(data.status ?? data.Status ?? "")
        .trim()
        .toLowerCase()
    : "";

  if (hubtelStatus === "paid" || hubtelStatus === "success") {
    return "paid";
  }
  if (hubtelStatus === "failed" || hubtelStatus === "refunded" || hubtelStatus === "declined") {
    return "failed";
  }
  if (
    hubtelStatus === "unpaid" ||
    hubtelStatus === "pending" ||
    hubtelStatus === "unconfirmed" ||
    responseCode === "0001"
  ) {
    return "pending";
  }
  if (responseCode === "2001") {
    return "failed";
  }
  return "unknown";
}

export function isHubtelPaymentCheckTerminal(payload: unknown): boolean {
  const state = resolveHubtelTxnPaymentStateFromCheck(payload);
  return state === "paid" || state === "failed";
}

export function mergeHubtelStatusCheckIntoTransaction(
  current: HubtelTransactionSnapshot,
  payload: unknown,
): HubtelTransactionSnapshot {
  const result = extractHubtelStatusCheckResult(payload);
  if (result.transaction) {
    return { ...current, ...result.transaction };
  }

  const flat = flattenApiData(payload);
  const hubtelBlock = flat?.hubtel;
  const hubtelRecord =
    hubtelBlock && typeof hubtelBlock === "object" && !Array.isArray(hubtelBlock)
      ? (hubtelBlock as Record<string, unknown>)
      : null;
  const nestedData = hubtelRecord?.data;
  const nestedRecord =
    nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)
      ? (nestedData as Record<string, unknown>)
      : null;

  const paymentState = resolveHubtelTxnPaymentStateFromCheck(payload);
  const responseCode =
    String(hubtelRecord?.responseCode ?? hubtelRecord?.response_code ?? "").trim() || null;
  const externalId = nestedRecord?.transactionId ?? nestedRecord?.externalTransactionId;

  let status = current.status;
  if (paymentState === "paid") {
    status = "success";
  } else if (paymentState === "failed") {
    status = "failed";
  }

  return {
    ...current,
    status,
    response_code: responseCode ?? current.response_code,
    external_transaction_id:
      externalId != null ? String(externalId) : current.external_transaction_id,
  };
}

const SERVICE_ORDER_TERMINAL_STATUSES = new Set(["delivered", "failed", "refunded"]);

export function readServiceOrderStatus(order: unknown): string | null {
  if (!order || typeof order !== "object" || Array.isArray(order)) {
    return null;
  }
  const status = (order as Record<string, unknown>).status;
  return typeof status === "string" && status.trim() ? status : null;
}

export function isServiceOrderTerminal(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }
  return SERVICE_ORDER_TERMINAL_STATUSES.has(status.toLowerCase());
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
