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
  useHubtelQueryBundlesMutation,
  useHubtelTestDataBundleMutation,
} from "@/store/admin-api";
import { isValidHubtelGhanaMobile, toHubtelInternationalFormat } from "@/lib/ghana-phone";
import {
  extractHubtelCommissionMeta,
  extractHubtelTransactionSnapshot,
  formatAdminMutationError as failMsg,
  readAdminField,
} from "@/lib/admin-api-envelope";
import type { HubtelTestTransactionSnapshot } from "@/components/hubtel/hubtel-test-followup";

export type HubtelBundleOption = {
  bundleId: string;
  displayName: string;
  amountGhs: number;
  listKey: string;
};

type HubtelDataBundlesCardProps = {
  network: string;
  onNetworkChange: (network: string) => void;
  prefetchDest: string;
  onPrefetchDestChange: (value: string) => void;
  checkoutBusy: boolean;
  anyCheckoutBusy: boolean;
  payDirectBusy?: boolean;
  onCheckout: (
    body: Record<string, unknown>,
  ) => Promise<{ recipientName: string | null } | void>;
  onPayDirect?: (
    body: Record<string, unknown>,
    recipient: string,
    pendingHint: string,
  ) => Promise<HubtelTestTransactionSnapshot | null>;
  onCommissionTransaction?: (payload: unknown) => HubtelTestTransactionSnapshot | null;
};

export function HubtelDataBundlesCard({
  network,
  onNetworkChange,
  prefetchDest,
  onPrefetchDestChange,
  checkoutBusy,
  anyCheckoutBusy,
  payDirectBusy = false,
  onCheckout,
  onPayDirect,
  onCommissionTransaction,
}: HubtelDataBundlesCardProps): React.ReactElement {
  const { data: labConfig } = useHubtelLabConfigQuery();
  const [qBundle, { isLoading: bundleQuerying }] = useHubtelQueryBundlesMutation();
  const [testDataBundleDirect, { isLoading: directSending }] = useHubtelTestDataBundleMutation();

  const [bundles, setBundles] = useState<HubtelBundleOption[] | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<HubtelBundleOption | null>(null);
  const [recipient, setRecipient] = useState("");
  const [payeePhone, setPayeePhone] = useState("");
  const [verifiedName, setVerifiedName] = useState<string | null>(null);

  function normalizePhoneInput(value: string): string {
    return toHubtelInternationalFormat(value);
  }

  async function loadBundles(dest: string, net: string): Promise<void> {
    const destination = normalizePhoneInput(dest);
    if (!isValidHubtelGhanaMobile(destination)) {
      toast.error("Enter a valid Ghana mobile (e.g. 0548496120 or 2330548496120).");
      return;
    }
    const payload = await qBundle({
      destination,
      network: net,
    }).unwrap();
    const bundleList = readAdminField<HubtelBundleOption[]>(payload, "bundles") ?? [];
    const bundleCount = readAdminField<number>(payload, "bundle_count") ?? bundleList.length;
    setBundles(bundleList);
    setSelectedBundle(null);
    if (bundleList.length === 0) {
      toast.message("No bundles returned — inspect server logs / Hubtel raw response.");
    } else {
      toast.success(`Loaded ${bundleCount} bundle(s).`);
    }
  }

  useEffect(() => {
    const prefetch = labConfig?.prefetch_phone?.trim();
    if (prefetch && !prefetchDest) {
      onPrefetchDestChange(prefetch);
    }
    if (prefetch && !payeePhone) {
      setPayeePhone(prefetch);
    }
  }, [labConfig, prefetchDest, onPrefetchDestChange, payeePhone]);

  useEffect(() => {
    const phone = prefetchDest.trim();
    if (phone.length < 9) return;
    void loadBundles(phone, network).catch((error) => {
      toast.error(failMsg(error));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]);

  const actionsBusy = directSending || checkoutBusy || payDirectBusy;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <CardTitle className="text-base">Data bundles</CardTitle>
        {verifiedName ? (
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Verified name</p>
            <p className="text-sm font-medium">{verifiedName}</p>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Enter a prefetch number to load the bundle catalogue, then pick a bundle and recipient for
          direct send or checkout. Ghana numbers are normalized to{" "}
          <span className="font-mono text-xs">233…</span>.
        </p>
        {labConfig?.prefetch_phone ? (
          <p className="text-muted-foreground text-xs">
            Default number: <span className="font-mono">{labConfig.prefetch_phone}</span>
          </p>
        ) : (
          <p className="text-xs text-amber-800 dark:text-amber-200">
            No default phone number is configured. Enter a number below to load bundles.
          </p>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Prefetch number</Label>
            <Input
              value={prefetchDest}
              onChange={(e) => {
                onPrefetchDestChange(e.target.value);
              }}
              onBlur={(e) => {
                const normalized = normalizePhoneInput(e.target.value);
                if (normalized && normalized !== e.target.value.trim()) {
                  onPrefetchDestChange(normalized);
                }
              }}
              placeholder="0548496120 or 2330548496120"
            />
          </div>
          <div className="space-y-2">
            <Label>Network</Label>
            <select
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={network}
              onChange={(e) => {
                onNetworkChange(e.target.value);
              }}
            >
              <option value="mtn">mtn</option>
              <option value="telecel">telecel</option>
              <option value="at">at</option>
              <option value="broadband_telecel">broadband_telecel</option>
            </select>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={bundleQuerying || !prefetchDest.trim()}
          onClick={() => {
            void loadBundles(prefetchDest, network).catch((error) => {
              toast.error(failMsg(error));
            });
          }}
        >
          {bundleQuerying ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Loading…
            </>
          ) : (
            "Reload bundles"
          )}
        </Button>
        {bundles && bundles.length > 0 ? (
          <div className="space-y-2">
            <Label>Select a bundle</Label>
            <div className="max-h-64 overflow-auto rounded-md border">
              <ul className="divide-y">
                {bundles.slice(0, 100).map((b) => {
                  const selected = selectedBundle?.listKey === b.listKey;
                  return (
                    <li key={b.listKey}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                          selected ? "bg-primary/10 ring-primary ring-1" : "hover:bg-muted"
                        }`}
                        onClick={() => {
                          setSelectedBundle(b);
                        }}
                      >
                        <span className="truncate">{b.displayName}</span>
                        <span className="text-muted-foreground shrink-0 font-mono text-xs">
                          GHS {b.amountGhs.toFixed(2)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}
        {selectedBundle ? (
          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-medium">{selectedBundle.displayName}</p>
            <p className="text-muted-foreground font-mono text-xs">
              {selectedBundle.bundleId} · GHS {selectedBundle.amountGhs.toFixed(2)}
            </p>
            <div className="space-y-2">
              <Label>Recipient number (data goes here)</Label>
              <Input
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  setVerifiedName(null);
                }}
                onBlur={(e) => {
                  const normalized = normalizePhoneInput(e.target.value);
                  if (normalized && normalized !== e.target.value.trim()) {
                    setRecipient(normalized);
                  }
                }}
                placeholder="0548496120 or 2330548496120"
              />
            </div>
            <div className="space-y-2">
              <Label>Your phone (Hubtel checkout SMS)</Label>
              <Input
                value={payeePhone}
                onChange={(e) => {
                  setPayeePhone(e.target.value);
                }}
                placeholder="Number that receives payment prompt"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={actionsBusy || anyCheckoutBusy || !recipient.trim()}
                onClick={async () => {
                  const destination = normalizePhoneInput(recipient);
                  if (!isValidHubtelGhanaMobile(destination)) {
                    toast.error("Enter a valid Ghana mobile for the recipient.");
                    return;
                  }
                  setRecipient(destination);
                  try {
                    const payload = await testDataBundleDirect({
                      destination,
                      amount: selectedBundle.amountGhs,
                      bundle: selectedBundle.bundleId,
                      network,
                    }).unwrap();
                    onCommissionTransaction?.(payload);
                    const transaction = extractHubtelTransactionSnapshot(payload);
                    const hubtelMeta = extractHubtelCommissionMeta(payload);
                    const ref = transaction?.client_reference ?? "ok";
                    if (hubtelMeta?.pending || transaction?.response_code === "0001") {
                      toast.success(
                        `Hubtel accepted (0001 pending). Ref ${ref}. Bundle may deliver before callback.`,
                      );
                    } else {
                      toast.success(`Data bundle sent via Commission Services. Ref ${ref}.`);
                    }
                  } catch (error) {
                    toast.error(failMsg(error));
                  }
                }}
              >
                {directSending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  "1. Send bundle direct (Commission Services)"
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={
                  actionsBusy ||
                  anyCheckoutBusy ||
                  !recipient.trim() ||
                  !isValidHubtelGhanaMobile(payeePhone)
                }
                onClick={async () => {
                  const destination = normalizePhoneInput(recipient);
                  if (!isValidHubtelGhanaMobile(destination)) {
                    toast.error("Enter a valid Ghana mobile for the recipient.");
                    return;
                  }
                  if (!onPayDirect) {
                    return;
                  }
                  setRecipient(destination);
                  const payerPhone = normalizePhoneInput(payeePhone);
                  await onPayDirect(
                    {
                      product: "data",
                      network,
                      service_type: `data_${network}`,
                      recipient: destination,
                      delivery_amount: selectedBundle.amountGhs,
                      charged_amount: selectedBundle.amountGhs,
                      data_bundle_id: selectedBundle.bundleId,
                      payer_phone: payerPhone,
                      description: `Data bundle for ${destination}`,
                    },
                    destination,
                    "MoMo prompt sent (0001 pending). Approve on your phone — bundle delivers after payment.",
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
                disabled={actionsBusy || anyCheckoutBusy || !recipient.trim()}
                onClick={async () => {
                  const destination = normalizePhoneInput(recipient);
                  if (!isValidHubtelGhanaMobile(destination)) {
                    toast.error("Enter a valid Ghana mobile for the recipient.");
                    return;
                  }
                  setRecipient(destination);
                  const body: Record<string, unknown> = {
                    product: "data",
                    network,
                    service_type: `data_${network}`,
                    recipient: destination,
                    delivery_amount: selectedBundle.amountGhs,
                    charged_amount: selectedBundle.amountGhs,
                    data_bundle_id: selectedBundle.bundleId,
                    description: `Data bundle for ${destination}`,
                  };
                  if (payeePhone.trim()) {
                    body.payee_phone = payeePhone.trim();
                  }
                  const result = await onCheckout(body);
                  if (result?.recipientName) {
                    setVerifiedName(result.recipientName);
                  }
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
        ) : null}
      </CardContent>
    </Card>
  );
}
