import { readAdminField, unwrapAdminPayload } from "@/lib/admin-api-envelope";

export type HubtelUtilityQueryService =
  | "ghana_water"
  | "dstv"
  | "gotv"
  | "startimes";

export type HubtelUtilityPayService = HubtelUtilityQueryService | "telecel_postpaid";

export type HubtelUtilityQueryAccount = {
  account_name: string;
  account_number: string;
  amount_due_ghs: number | null;
  session_id: string | null;
};

export type HubtelUtilityQueryDetailRow = {
  key: string;
  label: string;
  value: string;
  amount_ghs: number | null;
};

export type HubtelUtilityQueryResult = {
  service: string;
  destination: string;
  mobile: string | null;
  query_succeeded: boolean;
  response_code: string;
  message: string;
  account: HubtelUtilityQueryAccount;
  details: HubtelUtilityQueryDetailRow[];
};

export const HUBTEL_UTILITY_QUERY_SERVICES: { value: HubtelUtilityQueryService; label: string }[] =
  [
    { value: "ghana_water", label: "Water (Ghana Water)" },
    { value: "dstv", label: "DSTV" },
    { value: "gotv", label: "GOtv" },
    { value: "startimes", label: "StarTimes" },
  ];

export function utilityServiceLabel(service: string): string {
  return (
    HUBTEL_UTILITY_QUERY_SERVICES.find((row) => row.value === service)?.label ??
    service.replaceAll("_", " ")
  );
}

export function parseHubtelUtilityQueryResult(payload: unknown): HubtelUtilityQueryResult | null {
  const flat = unwrapAdminPayload(payload);
  if (!flat) {
    return null;
  }
  const accountRaw = flat.account;
  const account =
    accountRaw && typeof accountRaw === "object" && !Array.isArray(accountRaw)
      ? (accountRaw as Record<string, unknown>)
      : {};
  const detailsRaw = flat.details;
  const details = Array.isArray(detailsRaw)
    ? detailsRaw
        .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
        .map((row) => ({
          key: String(row.key ?? ""),
          label: String(row.label ?? row.key ?? "Detail"),
          value: String(row.value ?? ""),
          amount_ghs:
            typeof row.amount_ghs === "number" && Number.isFinite(row.amount_ghs)
              ? row.amount_ghs
              : null,
        }))
    : [];

  return {
    service: String(flat.service ?? ""),
    destination: String(flat.destination ?? ""),
    mobile: flat.mobile == null ? null : String(flat.mobile),
    query_succeeded: flat.query_succeeded === true,
    response_code: String(flat.response_code ?? ""),
    message: String(flat.message ?? ""),
    account: {
      account_name: String(account.account_name ?? ""),
      account_number: String(account.account_number ?? ""),
      amount_due_ghs:
        typeof account.amount_due_ghs === "number" && Number.isFinite(account.amount_due_ghs)
          ? account.amount_due_ghs
          : null,
      session_id:
        account.session_id == null || String(account.session_id).trim() === ""
          ? null
          : String(account.session_id),
    },
    details,
  };
}

export function readHubtelUtilityQueryResult(payload: unknown): HubtelUtilityQueryResult | null {
  return parseHubtelUtilityQueryResult(payload) ?? readAdminField<HubtelUtilityQueryResult>(payload, "data") ?? null;
}

export function formatUtilityAmountGhs(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) {
    return "—";
  }
  return `GHS ${amount.toFixed(2)}`;
}

export function buildUtilityQueryRequestBody(
  service: HubtelUtilityQueryService,
  reference: string,
  mobile: string,
): Record<string, unknown> {
  const destination = reference.trim();
  if (service === "ghana_water") {
    return { service, destination, mobile: mobile.trim() || destination };
  }
  return { service, destination };
}
