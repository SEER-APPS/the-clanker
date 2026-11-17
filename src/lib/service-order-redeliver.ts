const PHONE_OVERRIDE_PRODUCTS = new Set(["ecg", "ghana_water", "airtime", "data"]);

export function canRedeliverServiceOrderStatus(status: string | undefined | null): boolean {
  const normalized = String(status ?? "").toLowerCase();
  return normalized === "failed" || normalized === "paid" || normalized === "delivering";
}

export function serviceOrderAcceptsDeliveryPhone(product: string | undefined | null): boolean {
  return PHONE_OVERRIDE_PRODUCTS.has(String(product ?? "").toLowerCase());
}

export function readCustomerPhoneFromOrderMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const phone = (metadata as Record<string, unknown>).customer_phone;
  if (typeof phone !== "string") {
    return null;
  }
  const trimmed = phone.trim();
  return trimmed === "" ? null : trimmed;
}
