/** Default customer email for Hubtel Ghana Water bill payments when none is supplied. */
export const PLATFORM_UTILITY_BILL_EMAIL = "ericknextlink@gmail.com";

export function resolveGhanaWaterPaymentEmail(email?: string | null): string {
  const trimmed = email?.trim() ?? "";
  return trimmed || PLATFORM_UTILITY_BILL_EMAIL;
}
