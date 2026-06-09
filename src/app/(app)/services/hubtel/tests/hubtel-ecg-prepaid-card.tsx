"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useHubtelLabConfigQuery,
  useHubtelQueryUtilityMutation,
  useHubtelTestUtilityMutation,
} from "@/store/admin-api";
import { isValidHubtelGhanaMobile, toHubtelInternationalFormat } from "@/lib/ghana-phone";
import {
  extractHubtelCommissionMeta,
  extractHubtelTransactionSnapshot,
  formatAdminMutationError as failMsg,
  readAdminField,
} from "@/lib/admin-api-envelope";
import type { HubtelTestTransactionSnapshot } from "@/components/hubtel/hubtel-test-followup";

export type HubtelEcgMeterOption = {
  meterNumber: string;
  displayName: string;
  outstandingGhs: number | null;
};

type HubtelEcgPrepaidCardProps = {
  checkoutBusy: boolean;
  anyCheckoutBusy: boolean;
  payDirectBusy?: boolean;
  onCheckout: (body: Record<string, unknown>) => Promise<void>;
  onPayDirect?: (
    body: Record<string, unknown>,
    recipient: string,
    pendingHint: string,
  ) => Promise<HubtelTestTransactionSnapshot | null>;
  onCommissionTransaction?: (payload: unknown) => HubtelTestTransactionSnapshot | null;
};

function formatOutstanding(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount)) {
    return "—";
  }
  return `GHS ${amount.toFixed(2)}`;
}

export function HubtelEcgPrepaidCard({
  checkoutBusy,
  anyCheckoutBusy,
  payDirectBusy = false,
  onCheckout,
  onPayDirect,
  onCommissionTransaction,
}: HubtelEcgPrepaidCardProps): React.ReactElement {
  const { data: labConfig } = useHubtelLabConfigQuery();
  const [queryEcg, { isLoading: querying }] = useHubtelQueryUtilityMutation();
  const [payEcgDirect, { isLoading: directPaying }] = useHubtelTestUtilityMutation();

  const [mobile, setMobile] = useState("");
  const [payeePhone, setPayeePhone] = useState("");
  const [meters, setMeters] = useState<HubtelEcgMeterOption[] | null>(null);
  const [selectedMeter, setSelectedMeter] = useState<HubtelEcgMeterOption | null>(null);
  const [manualMeter, setManualMeter] = useState("");
  const [amountGhs, setAmountGhs] = useState("");

  useEffect(() => {
    const prefetch = labConfig?.prefetch_phone?.trim();
    if (prefetch && !mobile) {
      setMobile(prefetch);
    }
    if (prefetch && !payeePhone) {
      setPayeePhone(prefetch);
    }
  }, [labConfig, mobile, payeePhone]);

  const resolvedMeter = (selectedMeter?.meterNumber ?? manualMeter).trim();
  const actionsBusy = querying || directPaying || checkoutBusy || payDirectBusy;

  function normalizePhoneInput(value: string): string {
    return toHubtelInternationalFormat(value);
  }

  async function loadMeters(phone: string): Promise<void> {
    const destination = normalizePhoneInput(phone);
    if (!isValidHubtelGhanaMobile(destination)) {
      toast.error("Enter a valid Ghana mobile (e.g. 0548496120 or 2330548496120).");
      return;
    }
    setMobile(destination);
    const payload = await queryEcg({
      service: "ecg",
      destination,
    }).unwrap();
    const list = readAdminField<HubtelEcgMeterOption[]>(payload, "meters") ?? [];
    const meterCount = readAdminField<number>(payload, "meter_count") ?? list.length;
    setMeters(list);
    setSelectedMeter(null);
    if (list.length === 0) {
      toast.message("No meters returned — enter a meter number manually or check Hubtel logs.");
    } else {
      toast.success(`Found ${meterCount} meter(s).`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ECG electricity (prepaid / postpaid)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Use the ECG-linked mobile to find meters. Use your own phone for checkout SMS (Hubtel payment prompt) —
          change it when someone else is paying.
        </p>
        {labConfig?.prefetch_phone ? (
          <p className="text-muted-foreground text-xs">
            Default mobile: <span className="font-mono">{labConfig.prefetch_phone}</span>
          </p>
        ) : (
          <p className="text-xs text-amber-800 dark:text-amber-200">
            No default mobile is configured. Enter a number below for meter lookup.
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="ecg-mobile">Mobile linked to ECG account (meter lookup)</Label>
          <Input
            id="ecg-mobile"
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value);
            }}
            onBlur={(e) => {
              const normalized = normalizePhoneInput(e.target.value);
              if (normalized && normalized !== e.target.value.trim()) {
                setMobile(normalized);
              }
            }}
            placeholder="0548496120 or 2330548496120"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ecg-payee-phone">Your phone (Hubtel checkout SMS)</Label>
          <Input
            id="ecg-payee-phone"
            value={payeePhone}
            onChange={(e) => {
              setPayeePhone(e.target.value);
            }}
            onBlur={(e) => {
              const normalized = normalizePhoneInput(e.target.value);
              if (normalized && normalized !== e.target.value.trim()) {
                setPayeePhone(normalized);
              }
            }}
            placeholder="Who pays — receives payment prompt"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={querying || !mobile.trim()}
          onClick={() => {
            void loadMeters(mobile).catch((error) => {
              toast.error(failMsg(error));
            });
          }}
        >
          {querying ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Querying meters…
            </>
          ) : (
            "Query meters"
          )}
        </Button>
        {meters && meters.length > 0 ? (
          <div className="space-y-2">
            <Label>Select a meter</Label>
            <div className="max-h-64 overflow-auto rounded-md border">
              <ul className="divide-y">
                {meters.map((m) => {
                  const selected = selectedMeter?.meterNumber === m.meterNumber;
                  return (
                    <li key={m.meterNumber}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                          selected ? "bg-primary/10 ring-primary ring-1" : "hover:bg-muted"
                        }`}
                        onClick={() => {
                          setSelectedMeter(m);
                          setManualMeter(m.meterNumber);
                        }}
                      >
                        <span className="truncate">{m.displayName}</span>
                        <span className="text-muted-foreground shrink-0 font-mono text-xs">
                          {m.meterNumber} · bal {formatOutstanding(m.outstandingGhs)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}
        <div className="space-y-3 rounded-md border p-3">
          <div className="space-y-2">
            <Label htmlFor="ecg-meter-manual">Meter number</Label>
            <Input
              id="ecg-meter-manual"
              value={manualMeter}
              onChange={(e) => {
                setManualMeter(e.target.value);
                setSelectedMeter(null);
              }}
              placeholder="From query or enter manually"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ecg-amount">Top-up amount (GHS)</Label>
            <Input
              id="ecg-amount"
              value={amountGhs}
              onChange={(e) => {
                setAmountGhs(e.target.value);
              }}
              inputMode="decimal"
              placeholder="e.g. 50"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={
                actionsBusy || anyCheckoutBusy || !mobile.trim() || !resolvedMeter || !amountGhs.trim()
              }
              onClick={async () => {
                const amt = Number(amountGhs);
                if (!Number.isFinite(amt) || amt <= 0) {
                  toast.error("Enter a valid amount.");
                  return;
                }
                const destination = normalizePhoneInput(mobile);
                if (!isValidHubtelGhanaMobile(destination)) {
                  toast.error("Enter a valid Ghana mobile.");
                  return;
                }
                setMobile(destination);
                try {
                  const payload = await payEcgDirect({
                    service: "ecg",
                    destination,
                    amount: amt,
                    meter_number: resolvedMeter,
                  }).unwrap();
                  onCommissionTransaction?.(payload);
                  const transaction = extractHubtelTransactionSnapshot(payload);
                  const hubtelMeta = extractHubtelCommissionMeta(payload);
                  const ref = transaction?.client_reference ?? "ok";
                  if (hubtelMeta?.pending || transaction?.response_code === "0001") {
                    toast.success(
                      `Hubtel accepted (0001 pending). Ref ${ref}. ECG top-up may complete before callback.`,
                    );
                  } else {
                    toast.success(`ECG top-up sent via Commission Services. Ref ${ref}.`);
                  }
                } catch (error) {
                  toast.error(failMsg(error));
                }
              }}
            >
              {directPaying ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Paying…
                </>
              ) : (
                "1. Pay ECG direct (Commission Services)"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={
                actionsBusy ||
                anyCheckoutBusy ||
                !mobile.trim() ||
                !resolvedMeter ||
                !amountGhs.trim() ||
                !isValidHubtelGhanaMobile(payeePhone)
              }
              onClick={async () => {
                const amt = Number(amountGhs);
                if (!Number.isFinite(amt) || amt <= 0) {
                  toast.error("Enter a valid amount.");
                  return;
                }
                const destination = normalizePhoneInput(mobile);
                if (!isValidHubtelGhanaMobile(destination)) {
                  toast.error("Enter a valid Ghana mobile.");
                  return;
                }
                if (!onPayDirect) {
                  return;
                }
                setMobile(destination);
                const payerPhone = normalizePhoneInput(payeePhone);
                await onPayDirect(
                  {
                    product: "ecg",
                    recipient: destination,
                    delivery_amount: amt,
                    charged_amount: amt,
                    payer_phone: payerPhone,
                    description: `ECG prepaid for meter ${resolvedMeter}`,
                    metadata: {
                      customer_phone: destination,
                      meter_number: resolvedMeter,
                    },
                  },
                  destination,
                  "MoMo prompt sent (0001 pending). Approve on your phone — ECG top-up delivers after payment.",
                );
              }}
            >
              {payDirectBusy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Sending MoMo prompt…
                </>
              ) : (
                "2. Direct MoMo pay (push prompt) + deliver"
              )}
            </Button>
            <Button
              type="button"
              disabled={
                actionsBusy || anyCheckoutBusy || !mobile.trim() || !resolvedMeter || !amountGhs.trim()
              }
              onClick={async () => {
                const amt = Number(amountGhs);
                if (!Number.isFinite(amt) || amt <= 0) {
                  toast.error("Enter a valid amount.");
                  return;
                }
                const destination = normalizePhoneInput(mobile);
                if (!isValidHubtelGhanaMobile(destination)) {
                  toast.error("Enter a valid Ghana mobile.");
                  return;
                }
                setMobile(destination);
                const checkoutBody: Record<string, unknown> = {
                  product: "ecg",
                  recipient: destination,
                  delivery_amount: amt,
                  charged_amount: amt,
                  description: `ECG prepaid for meter ${resolvedMeter}`,
                  metadata: {
                    customer_phone: destination,
                    meter_number: resolvedMeter,
                  },
                };
                const payerPhone = normalizePhoneInput(payeePhone);
                if (isValidHubtelGhanaMobile(payerPhone)) {
                  checkoutBody.payee_phone = payerPhone;
                }
                await onCheckout(checkoutBody);
              }}
            >
              {checkoutBusy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Processing…
                </>
              ) : (
                "3. Online checkout (browser) + deliver"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
