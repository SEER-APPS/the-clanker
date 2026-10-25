/** How Hubtel collected money for this row (not the airtime/data product name). */

export type HubtelPaymentFlowCode = "commission" | "direct_pay" | "recurring";

export function formatHubtelPaymentFlowLabel(
  paymentFlowLabel: unknown,
  paymentFlow?: unknown,
): string {
  const code = String(paymentFlow ?? "").toLowerCase() as HubtelPaymentFlowCode | "";
  if (code === "recurring") {
    return "Subscription (recurring)";
  }
  if (code === "direct_pay") {
    return "Direct MoMo (one-time)";
  }
  if (code === "commission") {
    return "Commission service (one-time)";
  }

  const label = String(paymentFlowLabel ?? "").trim();
  if (label === "Recurring debit") {
    return "Subscription (recurring)";
  }
  if (label === "Direct Pay") {
    return "Direct MoMo (one-time)";
  }
  if (label === "Commission Services" || label === "") {
    return "Commission service (one-time)";
  }
  return label;
}

export function hubtelPaymentFlowTitle(paymentFlow?: unknown): string {
  const code = String(paymentFlow ?? "").toLowerCase();
  if (code === "recurring") {
    return "Scheduled Hubtel recurring invoice (subscription debits).";
  }
  if (code === "direct_pay") {
    return "In-app MoMo charge via Hubtel Receive Money — not a subscription.";
  }
  return "One-time purchase via Hubtel Commission Services (checkout or after MoMo pay).";
}
