export function canRedeliverServiceOrderStatus(status: string | undefined | null): boolean {
  const normalized = String(status ?? "").toLowerCase();
  return normalized === "failed" || normalized === "paid" || normalized === "delivering";
}
