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

export type HubtelEcgMeterOption = {
  meterNumber: string;
  displayName: string;
  outstandingGhs: number | null;
};

type HubtelEcgPrepaidCardProps = {
  checkoutBusy: boolean;
  anyCheckoutBusy: boolean;
  onCheckout: (body: Record<string, unknown>) => Promise<void>;
};

function failMsg(e: unknown): string {
  if (e && typeof e === "object" && "data" in e) {
    const m = (e as { data?: { message?: string } }).data?.message;
    if (m) return m;
  }
  return "Request failed.";
}

function formatOutstanding(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount)) {
    return "—";
  }
  return `GHS ${amount.toFixed(2)}`;
}

export function HubtelEcgPrepaidCard({
  checkoutBusy,
  anyCheckoutBusy,
  onCheckout,
}: HubtelEcgPrepaidCardProps): React.ReactElement {
  const { data: labConfig } = useHubtelLabConfigQuery();
  const [queryEcg, { isLoading: querying }] = useHubtelQueryUtilityMutation();
  const [payEcgDirect, { isLoading: directPaying }] = useHubtelTestUtilityMutation();

  const [mobile, setMobile] = useState("");
  const [meters, setMeters] = useState<HubtelEcgMeterOption[] | null>(null);
  const [selectedMeter, setSelectedMeter] = useState<HubtelEcgMeterOption | null>(null);
  const [manualMeter, setManualMeter] = useState("");
  const [amountGhs, setAmountGhs] = useState("");

  useEffect(() => {
    const prefetch = labConfig?.prefetch_phone?.trim();
    if (prefetch && !mobile) {
      setMobile(prefetch);
    }
  }, [labConfig, mobile]);

  const resolvedMeter = (selectedMeter?.meterNumber ?? manualMeter).trim();
  const actionsBusy = querying || directPaying || checkoutBusy;

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
    const res = (await queryEcg({
      service: "ecg",
      destination,
    }).unwrap()) as {
      meters?: HubtelEcgMeterOption[];
      meter_count?: number;
    };
    const list = res.meters ?? [];
    setMeters(list);
    setSelectedMeter(null);
    if (list.length === 0) {
      toast.message("No meters returned — enter a meter number manually or check Hubtel logs.");
    } else {
      toast.success(`Found ${res.meter_count ?? list.length} meter(s).`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ECG electricity (prepaid / postpaid)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Query meters linked to a mobile number (ECG Power App), pick a meter, enter top-up amount, then pay via
          Commission Services or Online Checkout.
        </p>
        {labConfig?.prefetch_phone ? (
          <p className="text-muted-foreground text-xs">
            Default mobile from <code className="text-xs">SEER_PHONE_NUMBER</code>:{" "}
            <span className="font-mono">{labConfig.prefetch_phone}</span>
          </p>
        ) : (
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Set SEER_PHONE_NUMBER in seer-platform/.env to prefill the mobile used for meter lookup.
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="ecg-mobile">Mobile linked to ECG account</Label>
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
        <Button
          type="button"
          variant="outline"
          disabled={querying || !mobile.trim()}
          onClick={() => {
            void loadMeters(mobile).catch((e) => {
              toast.error(failMsg(e));
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
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
                  await payEcgDirect({
                    service: "ecg",
                    destination,
                    amount: amt,
                    meter_number: resolvedMeter,
                  }).unwrap();
                  toast.success("ECG top-up sent via Commission Services.");
                } catch (e) {
                  toast.error(failMsg(e));
                }
              }}
            >
              {directPaying ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Paying…
                </>
              ) : (
                "Pay ECG direct (CS)"
              )}
            </Button>
            <Button
              type="button"
              className="flex-1"
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
                await onCheckout({
                  product: "ecg",
                  recipient: destination,
                  delivery_amount: amt,
                  charged_amount: amt,
                  description: `ECG prepaid for meter ${resolvedMeter}`,
                  metadata: {
                    customer_phone: destination,
                    meter_number: resolvedMeter,
                  },
                });
              }}
            >
              {checkoutBusy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Processing…
                </>
              ) : (
                "Checkout & pay ECG"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
