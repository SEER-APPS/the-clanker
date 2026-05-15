import type {
  OrderStatusPayload,
  PaymentStatusPayload,
  ResolveCheckoutPayload,
} from "@/types/payment-return.types";

const JSON_HEADERS = { Accept: "application/json" } as const;
const POST_JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
} as const;

function readNestedString(body: unknown, path: string[]): string | undefined {
  let current: unknown = body;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

function readNestedBoolean(body: unknown, path: string[]): boolean {
  let current: unknown = body;
  for (const key of path) {
    if (!current || typeof current !== "object") return false;
    current = (current as Record<string, unknown>)[key];
  }
  return current === true;
}

function readMetadataString(body: unknown, key: string): string | undefined {
  const root =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).data
      : null;
  const meta =
    root && typeof root === "object" && !Array.isArray(root)
      ? (root as Record<string, unknown>).metadata
      : null;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return undefined;
  }
  const v = (meta as Record<string, unknown>)[key];
  if (v == null) {
    return undefined;
  }
  const s = String(v).trim();
  return s || undefined;
}

/**
 * Triggers Laravel best-effort delivery after checkout (for return URL / when Hubtel status API is blocked).
 */
export async function postCompleteFromReturn(
  backendBase: string,
  checkoutId: string,
): Promise<{ ok: boolean }> {
  try {
    const r = await fetch(
      `${backendBase}/services/complete-from-return/${encodeURIComponent(checkoutId)}`,
      { method: "POST", headers: POST_JSON_HEADERS, body: "{}" },
    );
    return { ok: r.ok };
  } catch {
    return { ok: false };
  }
}

export async function fetchPaymentStatusHubtel(
  backendBase: string,
  checkoutId: string,
): Promise<PaymentStatusPayload> {
  try {
    const r = await fetch(
      `${backendBase}/services/payment-status/${encodeURIComponent(checkoutId)}`,
      { headers: JSON_HEADERS },
    );
    const body: unknown = await r.json().catch(() => null);
    const orderStatus = readNestedString(body, ["data", "order_status"]);
    const statusApiUnavailable = readNestedBoolean(body, ["data", "status_api_unavailable"]);
    if (!r.ok) {
      return {
        hubtelStatus: "",
        ok: false,
        statusApiUnavailable: true,
        orderStatus,
      };
    }
    const hubtel =
      readNestedString(body, ["data", "hubtel_status"]) ??
      readNestedString(body, ["data", "hubtelStatus"]) ??
      "";
    return {
      hubtelStatus: hubtel,
      ok: true,
      statusApiUnavailable,
      orderStatus,
    };
  } catch {
    return { hubtelStatus: "", ok: false, statusApiUnavailable: true };
  }
}

export async function fetchOrderByUuid(
  backendBase: string,
  orderUuid: string,
): Promise<OrderStatusPayload> {
  try {
    const r = await fetch(
      `${backendBase}/services/order/${encodeURIComponent(orderUuid)}`,
      { headers: JSON_HEADERS },
    );
    const body: unknown = await r.json().catch(() => null);
    if (!r.ok) {
      return { status: "", ok: false };
    }
    const status = readNestedString(body, ["data", "status"]) ?? "";
    const errorMessage = readNestedString(body, ["data", "error_message"]);
    const product = readNestedString(body, ["data", "product"]);
    const recipient = readNestedString(body, ["data", "recipient"]);
    const meterNumber =
      readMetadataString(body, "meter_number") ?? readMetadataString(body, "meter");
    const linkedMobile =
      readMetadataString(body, "customer_phone") ?? readMetadataString(body, "phone");
    const data = (body as Record<string, unknown>)?.data;
    let chargedAmount: number | undefined;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const raw = (data as Record<string, unknown>).charged_amount;
      if (typeof raw === "number" && Number.isFinite(raw)) {
        chargedAmount = raw;
      } else if (typeof raw === "string" && raw.trim()) {
        const n = Number(raw);
        if (Number.isFinite(n)) chargedAmount = n;
      }
    }
    return {
      status,
      ok: true,
      errorMessage,
      product,
      recipient,
      chargedAmount,
      meterNumber: meterNumber || undefined,
      linkedMobile: linkedMobile || undefined,
    };
  } catch {
    return { status: "", ok: false };
  }
}

export async function resolveOrderUuidByCheckout(
  backendBase: string,
  checkoutId: string,
): Promise<ResolveCheckoutPayload> {
  try {
    const r = await fetch(
      `${backendBase}/services/order/by-checkout/${encodeURIComponent(checkoutId)}`,
      { headers: JSON_HEADERS },
    );
    const body: unknown = await r.json().catch(() => null);
    const success =
      body &&
      typeof body === "object" &&
      (body as Record<string, unknown>).success === true;
    const orderUuid = readNestedString(body, ["data", "order_uuid"]) ?? null;
    const message =
      typeof (body as Record<string, unknown>)?.message === "string"
        ? ((body as Record<string, unknown>).message as string)
        : undefined;
    if (r.ok && success && orderUuid) {
      return { orderUuid, ok: true };
    }
    return { orderUuid: null, ok: false, message };
  } catch {
    return { orderUuid: null, ok: false };
  }
}

/** Hubtel-normalized checkout id query keys */
export function readCheckoutIdFromParams(sp: URLSearchParams): string | null {
  const v =
    sp.get("checkoutid") ?? sp.get("checkoutId") ?? sp.get("checkout_id");
  const t = v?.trim();
  return t || null;
}

export function readOrderUuidFromParams(sp: URLSearchParams): string | null {
  const v = sp.get("order_uuid") ?? sp.get("orderUuid");
  const t = v?.trim();
  return t || null;
}

export const PAYMENT_POLL_MAX_UUID_ATTEMPTS = 12;
export const PAYMENT_STATUS_MAX_ATTEMPTS = 4;
export const POLL_BY_UUID_INTERVAL_MS = 3000;
export const RESOLVE_CHECKOUT_INTERVAL_MS = 2500;
export const POLL_INITIAL_DELAY_MS = 400;
