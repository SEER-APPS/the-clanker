"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHubtelLabConfigQuery, useHubtelQueryUtilityMutation } from "@/store/admin-api";
import { isValidHubtelGhanaMobile, toHubtelInternationalFormat } from "@/lib/ghana-phone";
import { formatAdminMutationError as failMsg } from "@/lib/admin-api-envelope";
import {
  PLATFORM_UTILITY_BILL_EMAIL,
  resolveGhanaWaterPaymentEmail,
} from "@/lib/platform-defaults";
import {
  buildUtilityQueryRequestBody,
  formatUtilityAmountGhs,
  HUBTEL_UTILITY_QUERY_SERVICES,
  parseHubtelUtilityQueryResult,
  type HubtelUtilityPayService,
  type HubtelUtilityQueryResult,
  type HubtelUtilityQueryService,
  utilityServiceLabel,
} from "@/lib/hubtel-utility-query";

type HubtelUtilitiesQueryCardProps = {
  checkoutBusy: boolean;
  anyCheckoutBusy: boolean;
  payDirectBusy: boolean;
  onCheckout: (body: Record<string, unknown>) => Promise<void>;
  onPayDirect: (
    orderBody: Record<string, unknown>,
    recipient: string,
    pendingHint: string,
  ) => Promise<unknown>;
};

function buildUtilityPayDirectBody(args: {
  utilService: HubtelUtilityPayService;
  utilRef: string;
  utilMobile: string;
  utilAmount: string;
  utilMeter: string;
  utilEmail: string;
  utilSessionId: string;
  payerPhone: string;
}): { orderBody: Record<string, unknown>; recipient: string } | null {
  const {
    utilService,
    utilRef,
    utilMobile,
    utilAmount,
    utilMeter,
    utilEmail,
    utilSessionId,
    payerPhone,
  } = args;

  const ref = utilRef.trim();
  const amt = Number(utilAmount);
  const payer = toHubtelInternationalFormat(payerPhone);

  if (!ref || !Number.isFinite(amt) || amt <= 0) {
    toast.error("Enter reference and a valid amount.");
    return null;
  }

  if (!isValidHubtelGhanaMobile(payer)) {
    toast.error("Enter a valid payer mobile for Direct MoMo.");
    return null;
  }

  if (utilService === "ghana_water" && !utilSessionId.trim()) {
    toast.error("Ghana Water needs a session id from the query step.");
    return null;
  }

  const metadata: Record<string, unknown> = {};
  if (utilService === "ghana_water") {
    metadata.customer_phone = utilMobile.trim() || ref;
    metadata.meter_number = utilMeter.trim() || ref;
    metadata.email = resolveGhanaWaterPaymentEmail(utilEmail);
    metadata.session_id = utilSessionId.trim();
  }

  return {
    recipient: ref,
    orderBody: {
      product: utilService,
      recipient: ref,
      delivery_amount: amt,
      charged_amount: amt,
      payer_phone: payer,
      description: `${utilService} for ${ref}`,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    },
  };
}

async function submitUtilityOrTvCheckout(args: {
  utilService: HubtelUtilityPayService;
  utilRef: string;
  utilMobile: string;
  utilAmount: string;
  utilMeter: string;
  utilEmail: string;
  utilSessionId: string;
  onCheckout: (body: Record<string, unknown>) => Promise<void>;
}): Promise<void> {
  const {
    utilService,
    utilRef,
    utilMobile,
    utilAmount,
    utilMeter,
    utilEmail,
    utilSessionId,
    onCheckout,
  } = args;

  const ref = utilRef.trim();
  const amt = Number(utilAmount);

  if (!ref || !Number.isFinite(amt) || amt <= 0) {
    toast.error("Enter reference and a valid amount.");
    return;
  }

  if (utilService === "ghana_water" && !utilSessionId.trim()) {
    toast.error("Ghana Water needs a session id from the query step.");
    return;
  }

  const metadata: Record<string, unknown> = {};
  if (utilService === "ghana_water") {
    metadata.customer_phone = utilMobile.trim() || ref;
    metadata.meter_number = utilMeter.trim() || ref;
    metadata.email = resolveGhanaWaterPaymentEmail(utilEmail);
    metadata.session_id = utilSessionId.trim();
  }

  await onCheckout({
    product: utilService,
    recipient: ref,
    delivery_amount: amt,
    charged_amount: amt,
    description: `${utilService} for ${ref}`,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  });
}

function UtilityQueryResults({
  result,
  onApplyToPayment,
}: {
  result: HubtelUtilityQueryResult;
  onApplyToPayment: () => void;
}): React.ReactElement {
  const { account, details } = result;

  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={result.query_succeeded ? "black" : "mid"}>
          {result.response_code || "—"}
        </Badge>
        <span className="text-sm font-medium">{result.message || "No message from provider"}</span>
      </div>

      {result.query_succeeded ? (
        <>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Service</dt>
              <dd className="mt-1 text-sm font-medium">{utilityServiceLabel(result.service)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Reference</dt>
              <dd className="mt-1 font-mono text-sm">{result.destination}</dd>
            </div>
            {result.mobile ? (
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Mobile used</dt>
                <dd className="mt-1 font-mono text-sm">{result.mobile}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Account name</dt>
              <dd className="mt-1 text-sm">{account.account_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Account number</dt>
              <dd className="mt-1 font-mono text-sm">{account.account_number || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Amount due</dt>
              <dd className="mt-1 text-sm font-semibold">
                {formatUtilityAmountGhs(account.amount_due_ghs)}
              </dd>
            </div>
            {account.session_id ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Session ID</dt>
                <dd className="mt-1 break-all font-mono text-xs">{account.session_id}</dd>
              </div>
            ) : null}
          </dl>

          {details.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.map((row) => (
                    <TableRow key={`${row.key}-${row.value}`}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="font-mono text-xs">{row.value || "—"}</TableCell>
                      <TableCell className="text-right text-sm">
                        {formatUtilityAmountGhs(row.amount_ghs)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          <Button type="button" variant="secondary" size="sm" onClick={onApplyToPayment}>
            Apply to payment form
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Hubtel did not return account details for this reference. Check the service, reference
          number, and Ghana Water mobile, then try again.
        </p>
      )}
    </div>
  );
}

export function HubtelUtilitiesQueryCard({
  checkoutBusy,
  anyCheckoutBusy,
  payDirectBusy,
  onCheckout,
  onPayDirect,
}: HubtelUtilitiesQueryCardProps): React.ReactElement {
  const { data: labConfig } = useHubtelLabConfigQuery();
  const [queryUtility, { isLoading: querying }] = useHubtelQueryUtilityMutation();

  const [utilService, setUtilService] = useState<HubtelUtilityPayService>("ghana_water");
  const [utilRef, setUtilRef] = useState("");
  const [utilMobile, setUtilMobile] = useState("");
  const [utilAmount, setUtilAmount] = useState("");
  const [utilMeter, setUtilMeter] = useState("");
  const [utilEmail, setUtilEmail] = useState(PLATFORM_UTILITY_BILL_EMAIL);
  const [utilSessionId, setUtilSessionId] = useState("");
  const [utilPayeePhone, setUtilPayeePhone] = useState("");
  const [queryResult, setQueryResult] = useState<HubtelUtilityQueryResult | null>(null);

  const querySupported = utilService !== "telecel_postpaid";

  useEffect(() => {
    const prefetch = labConfig?.prefetch_phone?.trim();
    if (prefetch && !utilMobile) {
      setUtilMobile(prefetch);
    }
    if (prefetch && !utilPayeePhone) {
      setUtilPayeePhone(prefetch);
    }
  }, [labConfig, utilMobile, utilPayeePhone]);

  function applyQueryToPayment(): void {
    if (!queryResult?.query_succeeded) {
      return;
    }
    applyQueryToPaymentFromResult(queryResult);
    toast.success("Payment fields updated from query.");
  }

  function applyQueryToPaymentFromResult(result: HubtelUtilityQueryResult): void {
    const { account } = result;
    if (account.amount_due_ghs != null && Number.isFinite(account.amount_due_ghs)) {
      setUtilAmount(String(account.amount_due_ghs));
    }
    if (account.session_id) {
      setUtilSessionId(account.session_id);
    }
    if (account.account_number.trim()) {
      setUtilMeter(account.account_number.trim());
    }
  }

  async function runQuery(): Promise<void> {
    if (!querySupported) {
      toast.error("Telecel Postpaid does not support account query — enter details and pay directly.");
      return;
    }
    if (!utilRef.trim()) {
      toast.error("Enter a reference first.");
      return;
    }
    try {
      const body = buildUtilityQueryRequestBody(
        utilService as HubtelUtilityQueryService,
        utilRef,
        utilMobile,
      );
      const payload = await queryUtility(body).unwrap();
      const parsed = parseHubtelUtilityQueryResult(payload);
      if (!parsed) {
        toast.error("Could not read query response.");
        return;
      }
      setQueryResult(parsed);
      if (parsed.query_succeeded) {
        toast.success(`${utilityServiceLabel(parsed.service)} account found.`);
        applyQueryToPaymentFromResult(parsed);
      } else {
        toast.error(parsed.message || "Account query failed.");
      }
    } catch (error) {
      setQueryResult(null);
      toast.error(failMsg(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Utilities and TV (query, then checkout)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Ghana Water and TV accounts (DSTV, GOtv, StarTimes). Run <strong>Query account</strong>{" "}
          first for balance and session details, then pay. For ECG prepaid, use the card above.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="util-service">Service</Label>
            <select
              id="util-service"
              className="border-input bg-background h-9 w-full max-w-md rounded-md border px-3 text-sm"
              value={utilService}
              onChange={(e) => {
                setUtilService(e.target.value as HubtelUtilityPayService);
                setQueryResult(null);
              }}
            >
              {HUBTEL_UTILITY_QUERY_SERVICES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              <option value="telecel_postpaid">Telecel Postpaid (pay only)</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="util-ref">Reference (meter, smartcard, or account number)</Label>
            <Input
              id="util-ref"
              value={utilRef}
              onChange={(e) => {
                setUtilRef(e.target.value);
                setQueryResult(null);
              }}
              placeholder="e.g. Ghana Water meter or TV smartcard number"
            />
          </div>

          {utilService === "ghana_water" ? (
            <div className="space-y-2">
              <Label htmlFor="util-mobile">Mobile (Ghana Water query)</Label>
              <Input
                id="util-mobile"
                value={utilMobile}
                onChange={(e) => {
                  setUtilMobile(e.target.value);
                  setQueryResult(null);
                }}
                onBlur={(e) => {
                  const normalized = toHubtelInternationalFormat(e.target.value);
                  if (normalized && normalized !== e.target.value.trim()) {
                    setUtilMobile(normalized);
                  }
                }}
                placeholder="233XXXXXXXXX"
              />
            </div>
          ) : null}

          {utilService === "ghana_water" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="util-email">Customer email</Label>
                <Input
                  id="util-email"
                  type="email"
                  value={utilEmail}
                  onChange={(e) => {
                    setUtilEmail(e.target.value);
                  }}
                  placeholder={PLATFORM_UTILITY_BILL_EMAIL}
                />
                <p className="text-muted-foreground text-xs">
                  Defaults to the platform email if left unchanged.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="util-session">Session ID (from query)</Label>
                <Input
                  id="util-session"
                  value={utilSessionId}
                  onChange={(e) => {
                    setUtilSessionId(e.target.value);
                  }}
                  placeholder="Filled automatically after a successful query"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="util-meter">Meter number (payment)</Label>
                <Input
                  id="util-meter"
                  value={utilMeter}
                  onChange={(e) => {
                    setUtilMeter(e.target.value);
                  }}
                  placeholder="Usually same as reference"
                />
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="util-amount">Amount (GHS)</Label>
            <Input
              id="util-amount"
              value={utilAmount}
              onChange={(e) => {
                setUtilAmount(e.target.value);
              }}
              inputMode="decimal"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="util-payee-phone">Your phone (Direct MoMo payment)</Label>
            <Input
              id="util-payee-phone"
              value={utilPayeePhone}
              onChange={(e) => {
                setUtilPayeePhone(e.target.value);
              }}
              onBlur={(e) => {
                const normalized = toHubtelInternationalFormat(e.target.value);
                if (normalized && normalized !== e.target.value.trim()) {
                  setUtilPayeePhone(normalized);
                }
              }}
              placeholder="MoMo number for payment prompt"
            />
          </div>
        </div>

        {!querySupported ? (
          <p className="text-muted-foreground text-sm">
            Telecel Postpaid has no Hubtel query step. Enter the account reference and amount, then
            pay.
          </p>
        ) : null}

        {queryResult ? (
          <UtilityQueryResults result={queryResult} onApplyToPayment={applyQueryToPayment} />
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={querying || !querySupported}
            aria-busy={querying}
            onClick={() => {
              void runQuery();
            }}
          >
            {querying ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Querying…
              </>
            ) : (
              "Query account"
            )}
          </Button>
          <Button
            type="button"
            disabled={checkoutBusy || anyCheckoutBusy}
            aria-busy={checkoutBusy}
            onClick={async () => {
              try {
                await submitUtilityOrTvCheckout({
                  utilService,
                  utilRef,
                  utilMobile,
                  utilAmount,
                  utilMeter,
                  utilEmail,
                  utilSessionId,
                  onCheckout,
                });
              } catch (error) {
                toast.error(failMsg(error));
              }
            }}
          >
            {checkoutBusy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Creating checkout…
              </>
            ) : (
              "Checkout and pay"
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={anyCheckoutBusy || !isValidHubtelGhanaMobile(utilPayeePhone)}
            aria-busy={payDirectBusy}
            onClick={() => {
              const body = buildUtilityPayDirectBody({
                utilService,
                utilRef,
                utilMobile,
                utilAmount,
                utilMeter,
                utilEmail,
                utilSessionId,
                payerPhone: utilPayeePhone,
              });
              if (!body) {
                return;
              }
              void onPayDirect(
                body.orderBody,
                body.recipient,
                "MoMo prompt sent (0001 pending). Approve on your phone — service delivers after payment.",
              );
            }}
          >
            {payDirectBusy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Sending MoMo prompt…
              </>
            ) : (
              "Direct MoMo pay (push prompt)"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
