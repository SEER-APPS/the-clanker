/**
 * Normalize Ghana mobile for Hubtel (matches core `toInternationalFormat`).
 * Hubtel Commission Services expect 233 + 9 national digits, e.g. 233548496120.
 */
export function toHubtelInternationalFormat(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  if (digits.startsWith("233") && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith("2330") && digits.length === 13) {
    return `233${digits.slice(4)}`;
  }
  let national = digits.startsWith("233") ? digits.slice(3) : digits;
  national = national.replace(/^0+/, "");
  if (national.length > 9) {
    national = national.slice(-9);
  }
  if (national.length === 9) {
    return `233${national}`;
  }
  return digits;
}

export function isValidHubtelGhanaMobile(phone: string): boolean {
  const normalized = toHubtelInternationalFormat(phone);
  return /^233\d{9}$/.test(normalized);
}
