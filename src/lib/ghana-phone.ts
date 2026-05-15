/**
 * Normalize Ghana mobile numbers for Hubtel (accepts 12- or 13-digit 233… forms).
 *
 * Examples:
 * - 2330548496120 → unchanged
 * - 0548496120 → 2330548496120
 * - 548496120 → 2330548496120
 */
export function toHubtelInternationalFormat(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  if (digits.startsWith("233") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `2330${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `2330${digits}`;
  }
  return digits;
}

export function isValidHubtelGhanaMobile(phone: string): boolean {
  const normalized = toHubtelInternationalFormat(phone);
  return /^2330?\d{9}$/.test(normalized);
}
