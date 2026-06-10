"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useHubtelTestSmsMutation,
  useHubtelTestSmsBatchMutation,
  useHubtelTestAirtimeMutation,
  useHubtelStatusCheckMutation,
  useHubtelQueryUtilityMutation,
  useHubtelSyncPendingMutation,
  useHubtelLabConfigQuery,
  useServiceOrderCreateMutation,
  useServiceOrderStatusQuery,
  useLazyServiceOrderStatusQuery,
  useLazyServicePaymentStatusByCheckoutQuery,
} from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { HubtelDataBundlesCard } from "@/app/(app)/services/hubtel/tests/hubtel-data-bundles-card";
import { HubtelEcgPrepaidCard } from "@/app/(app)/services/hubtel/tests/hubtel-ecg-prepaid-card";
import {
  HubtelTestFollowup,
  type HubtelTestTransactionSnapshot,
} from "@/components/hubtel/hubtel-test-followup";
import {
  isValidHubtelGhanaMobile,
  toHubtelInternationalFormat,
} from "@/lib/ghana-phone";
import {
  extractHubtelCommissionMeta,
  extractHubtelStatusCheckResult,
  extractHubtelTransactionSnapshot,
  extractOrderCheckoutFields,
  flattenApiData,
  formatAdminMutationError as failMsg,
  isServiceOrderTerminal,
  mergeHubtelStatusCheckIntoTransaction,
  readServiceOrderMeter,
  readServiceOrderStatus,
  readHubtelPaymentStatusFromOrder,
} from "@/lib/admin-api-envelope";
import { useHubtelPayDirectHandler } from "@/hooks/use-hubtel-pay-direct-handler";
import { useHubtelTransactionPoll } from "@/hooks/use-hubtel-transaction-poll";

type UtilityServiceKey =
  | "ecg"
  | "ghana_water"
  | "dstv"
  | "gotv"
  | "startimes"
  | "telecel_postpaid";

export default function HubtelTestsPage(): React.ReactElement {
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMsg, setSmsMsg] = useState("");
  const [batchRecipients, setBatchRecipients] = useState("");
  const [airDest, setAirDest] = useState("");
  const [airAmt, setAirAmt] = useState("");
  const [airNet, setAirNet] = useState("mtn");
  const [airPayeePhone, setAirPayeePhone] = useState("");
  const [airVerifiedName, setAirVerifiedName] = useState<string | null>(null);
  const [lastCsTransaction, setLastCsTransaction] = useState<HubtelTestTransactionSnapshot | null>(
    null,
  );
  const [hubtelStatusLabel, setHubtelStatusLabel] = useState<string | null>(null);
  const [bDest, setBDest] = useState("");
  const [bNet, setBNet] = useState("mtn");
  const [utilService, setUtilService] = useState<UtilityServiceKey>("ghana_water");
  const [utilRef, setUtilRef] = useState("");
  const [utilMobile, setUtilMobile] = useState("");
  const [utilAmount, setUtilAmount] = useState("");
  const [utilMeter, setUtilMeter] = useState("");
  const [utilEmail, setUtilEmail] = useState("");
  const [utilSessionId, setUtilSessionId] = useState("");
  const [utilPayeePhone, setUtilPayeePhone] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [orderUuid, setOrderUuid] = useState<string | null>(null);

  const [sms, { isLoading: smsSending }] = useHubtelTestSmsMutation();
  const [smsBatch, { isLoading: smsBatchSending }] = useHubtelTestSmsBatchMutation();
  const [testAirtimeDirect, { isLoading: airtimeDirectSending }] = useHubtelTestAirtimeMutation();
  const [hubtelStatusCheck, { isLoading: hubtelStatusChecking }] = useHubtelStatusCheckMutation();
  const [qUtil, { isLoading: utilityQuerying }] = useHubtelQueryUtilityMutation();
  const [sync, { isLoading: hubtelSyncing }] = useHubtelSyncPendingMutation();
  const { data: labConfig } = useHubtelLabConfigQuery();
  const [createOrder] = useServiceOrderCreateMutation();
  const [airtimeCheckoutBusy, setAirtimeCheckoutBusy] = useState(false);
  const [dataBundleCheckoutBusy, setDataBundleCheckoutBusy] = useState(false);
  const [utilityCheckoutBusy, setUtilityCheckoutBusy] = useState(false);
  const [ecgCheckoutBusy, setEcgCheckoutBusy] = useState(false);
  const [getStatus, { isFetching: orderStatusFetching }] = useLazyServiceOrderStatusQuery();
  const [getPaymentStatus, { isFetching: paymentStatusFetching }] =
    useLazyServicePaymentStatusByCheckoutQuery();
  const [trackedOrderStatus, setTrackedOrderStatus] = useState<string | null>(null);
  const payDirectCallbacks = useMemo(
    () => ({
      setOrderUuid,
      setCheckoutOpen,
      setCheckoutUrl,
      setLastCsTransaction,
      setHubtelStatusLabel,
      setTrackedOrderStatus,
    }),
    [],
  );
  const { payDirectBusy, runPayDirect } = useHubtelPayDirectHandler(payDirectCallbacks);
  const anyCheckoutBusy =
    airtimeCheckoutBusy ||
    payDirectBusy ||
    dataBundleCheckoutBusy ||
    utilityCheckoutBusy ||
    ecgCheckoutBusy;

  const { data: liveOrder, isFetching: orderLiveFetching } = useServiceOrderStatusQuery(
    { uuid: orderUuid ?? "" },
    {
      skip: !checkoutOpen || !orderUuid,
      pollingInterval:
        checkoutOpen && orderUuid && !isServiceOrderTerminal(trackedOrderStatus) ? 5000 : 0,
    },
  );

  useEffect(() => {
    setTrackedOrderStatus(null);
  }, [orderUuid]);

  useEffect(() => {
    const nextStatus = readServiceOrderStatus(liveOrder);
    if (nextStatus !== trackedOrderStatus) {
      setTrackedOrderStatus(nextStatus);
    }
  }, [liveOrder, trackedOrderStatus]);

  useEffect(() => {
    const reconciledPayment = readHubtelPaymentStatusFromOrder(liveOrder);
    if (!reconciledPayment) {
      return;
    }
    setHubtelStatusLabel(reconciledPayment);
    setLastCsTransaction((current) => {
      if (!current?.client_reference) {
        return current;
      }
      const paid = reconciledPayment.trim().toLowerCase() === "paid";
      return {
        ...current,
        hubtel_payment_status: reconciledPayment,
        status: paid ? "success" : current.status,
      };
    });
  }, [liveOrder]);

  const { polling: hubtelAutoPolling } = useHubtelTransactionPoll({
    transaction: lastCsTransaction,
    onTransactionUpdate: setLastCsTransaction,
    onStatusLabelUpdate: setHubtelStatusLabel,
  });

  function applyCommissionPayload(payload: unknown): HubtelTestTransactionSnapshot | null {
    const transaction = extractHubtelTransactionSnapshot(payload);
    if (transaction) {
      setLastCsTransaction(transaction);
    }
    return transaction;
  }

  async function checkHubtelTransactionStatus(clientReference: string): Promise<void> {
    try {
      const payload = await hubtelStatusCheck({ client_reference: clientReference }).unwrap();
      const result = extractHubtelStatusCheckResult(payload);
      setHubtelStatusLabel(result.hubtelStatusLabel);
      setLastCsTransaction((current) => {
        if (!current?.client_reference) {
          return result.transaction ?? current;
        }
        return mergeHubtelStatusCheckIntoTransaction(current, payload);
      });
      toast.success(
        result.hubtelStatusLabel
          ? `Hubtel status: ${result.hubtelStatusLabel}`
          : result.hubtelMessage ?? "Status check completed.",
      );
    } catch (error) {
      toast.error(failMsg(error));
    }
  }

  const deliveredToastPrev = useRef<string | null>(null);
  useEffect(() => {
    deliveredToastPrev.current = null;
  }, [orderUuid]);

  useEffect(() => {
    const prefetch = labConfig?.prefetch_phone?.trim();
    if (prefetch && !airPayeePhone) {
      setAirPayeePhone(prefetch);
    }
    if (prefetch && !utilPayeePhone) {
      setUtilPayeePhone(prefetch);
    }
  }, [labConfig, airPayeePhone, utilPayeePhone]);

  const liveOrderMeter = readServiceOrderMeter(liveOrder);

  const liveOrderStatus = readServiceOrderStatus(liveOrder);
  const orderPollingActive =
    checkoutOpen && Boolean(orderUuid) && !isServiceOrderTerminal(liveOrderStatus);

  useEffect(() => {
    if (!checkoutOpen || !liveOrderStatus) {
      return;
    }
    if (liveOrderStatus === "delivered" && deliveredToastPrev.current !== "delivered") {
      toast.success("Order status: delivered.");
    }
    deliveredToastPrev.current = liveOrderStatus;
  }, [checkoutOpen, liveOrderStatus]);

  async function startCheckout(
    body: Record<string, unknown>,
  ): Promise<{ recipientName: string | null }> {
    const res = await createOrder({
      ...body,
      checkout_return_base_url:
        typeof window !== "undefined" ? window.location.origin : undefined,
    }).unwrap();
    const { orderUuid: oid, checkoutUrl: url, checkoutId: cid, recipientName } =
      extractOrderCheckoutFields(res);

    if (!url || !oid) {
      toast.warning(
        "Order created (201) but checkout URL or order id missing — check the Network tab response.",
      );
      return { recipientName: null };
    }

    setCheckoutUrl(url);
    setOrderUuid(oid);
    setCheckoutId(cid);
    setCheckoutOpen(true);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Checkout opened in a new tab.");
    return { recipientName };
  }

  return (
    <article className="space-y-6">
      <header>
        <Link
          href="/services/hubtel"
          className="text-muted-foreground text-sm hover:underline"
        >
          Back to Hubtel
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Hubtel tools</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          These calls hit live provider endpoints. Use staging credentials when available.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SMS</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={smsPhone}
                onChange={(e) => {
                  setSmsPhone(e.target.value);
                }}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Message</Label>
              <Input
                value={smsMsg}
                onChange={(e) => {
                  setSmsMsg(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={smsSending}
              aria-busy={smsSending}
              onClick={async () => {
                try {
                  const res = await sms({ phone: smsPhone, message: smsMsg }).unwrap();
                  toast.success("SMS request finished.");
                } catch (error) {
                  toast.error(failMsg(error));
                }
              }}
            >
              {smsSending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                "Send SMS"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={smsBatchSending}
              aria-busy={smsBatchSending}
              onClick={async () => {
                try {
                  await smsBatch({
                    recipients: batchRecipients,
                    message: smsMsg,
                  }).unwrap();
                  toast.success("Batch finished.");
                } catch (error) {
                  toast.error(failMsg(error));
                }
              }}
            >
              {smsBatchSending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Sending batch…
                </>
              ) : (
                "SMS batch"
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Batch recipients (comma-separated)</Label>
            <Input
              value={batchRecipients}
              onChange={(e) => {
                setBatchRecipients(e.target.value);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle className="text-base">Airtime test</CardTitle>
          {airVerifiedName ? (
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Verified name</p>
              <p className="text-sm font-medium">{airVerifiedName}</p>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="grid max-w-2xl gap-3 md:grid-cols-3">
          <p className="text-muted-foreground md:col-span-3 text-xs">
            Numbers are normalized to Hubtel format (<span className="font-mono">233XXXXXXXXX</span>) before
            send. Local <span className="font-mono">054…</span> is fine.
          </p>
          <div className="space-y-2 md:col-span-2">
            <Label>Destination (airtime recipient)</Label>
            <Input
              value={airDest}
              placeholder="0548496120 or 233548496120"
              onChange={(e) => {
                setAirDest(e.target.value);
                setAirVerifiedName(null);
              }}
              onBlur={(e) => {
                const normalized = toHubtelInternationalFormat(e.target.value);
                if (normalized && normalized !== e.target.value.trim()) {
                  setAirDest(normalized);
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              value={airAmt}
              onChange={(e) => {
                setAirAmt(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label>Your phone (Hubtel checkout SMS)</Label>
            <Input
              value={airPayeePhone}
              onChange={(e) => {
                setAirPayeePhone(e.target.value);
              }}
              onBlur={(e) => {
                const normalized = toHubtelInternationalFormat(e.target.value);
                if (normalized && normalized !== e.target.value.trim()) {
                  setAirPayeePhone(normalized);
                }
              }}
              placeholder="MoMo number for payment prompt (checkout / direct pay)"
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label>Network</Label>
            <select
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={airNet}
              onChange={(e) => {
                setAirNet(e.target.value);
                setAirVerifiedName(null);
              }}
            >
              <option value="mtn">mtn</option>
              <option value="telecel">telecel</option>
              <option value="at">at</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 md:col-span-3">
            <Button
              type="button"
              variant="outline"
              disabled={
                airtimeDirectSending ||
                anyCheckoutBusy ||
                !isValidHubtelGhanaMobile(airDest) ||
                !airAmt
              }
              aria-busy={airtimeDirectSending}
              onClick={async () => {
                setHubtelStatusLabel(null);
                try {
                  const destination = toHubtelInternationalFormat(airDest);
                  const payload = await testAirtimeDirect({
                    destination,
                    amount: Number(airAmt),
                    network: airNet,
                  }).unwrap();
                  const transaction = applyCommissionPayload(payload);
                  const hubtelMeta = extractHubtelCommissionMeta(payload);
                  const ref = transaction?.client_reference ?? "ok";
                  if (hubtelMeta?.pending || transaction?.response_code === "0001") {
                    toast.success(
                      `Hubtel accepted (0001 pending). Ref ${ref}. Airtime may deliver before callback.`,
                    );
                  } else {
                    toast.success(`Commission Services completed. Ref ${ref}.`);
                  }
                } catch (error) {
                  toast.error(failMsg(error));
                }
              }}
            >
              {airtimeDirectSending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                "1. Direct send (Commission Services)"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={
                airtimeDirectSending ||
                anyCheckoutBusy ||
                !isValidHubtelGhanaMobile(airDest) ||
                !airAmt ||
                !isValidHubtelGhanaMobile(airPayeePhone)
              }
              aria-busy={airtimeCheckoutBusy}
              onClick={async () => {
                setAirtimeCheckoutBusy(true);
                try {
                  const orderBody: Record<string, unknown> = {
                    product: "airtime",
                    network: airNet,
                    recipient: toHubtelInternationalFormat(airDest),
                    delivery_amount: Number(airAmt),
                    charged_amount: Number(airAmt),
                    description: `Airtime for ${toHubtelInternationalFormat(airDest)}`,
                    payee_phone: toHubtelInternationalFormat(airPayeePhone),
                  };
                  const { recipientName } = await startCheckout(orderBody);
                  if (recipientName) {
                    setAirVerifiedName(recipientName);
                  }
                } catch (error) {
                  toast.error(failMsg(error));
                } finally {
                  setAirtimeCheckoutBusy(false);
                }
              }}
            >
              {airtimeCheckoutBusy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Processing…
                </>
              ) : (
                "2. Online checkout (browser) + deliver"
              )}
            </Button>
            <Button
              type="button"
              disabled={
                airtimeDirectSending ||
                anyCheckoutBusy ||
                !isValidHubtelGhanaMobile(airDest) ||
                !airAmt ||
                !isValidHubtelGhanaMobile(airPayeePhone)
              }
              aria-busy={payDirectBusy}
              onClick={() => {
                const recipient = toHubtelInternationalFormat(airDest);
                void runPayDirect(
                  {
                    product: "airtime",
                    network: airNet,
                    recipient,
                    delivery_amount: Number(airAmt),
                    charged_amount: Number(airAmt),
                    payer_phone: toHubtelInternationalFormat(airPayeePhone),
                    description: `Airtime for ${recipient}`,
                  },
                  recipient,
                  "MoMo prompt sent (0001 pending). Approve on your phone — airtime delivers after payment.",
                );
              }}
            >
              {payDirectBusy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Sending MoMo prompt…
                </>
              ) : (
                "3. Direct MoMo pay (push prompt) + deliver"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <HubtelDataBundlesCard
        network={bNet}
        onNetworkChange={setBNet}
        prefetchDest={bDest}
        onPrefetchDestChange={setBDest}
        checkoutBusy={dataBundleCheckoutBusy}
        anyCheckoutBusy={anyCheckoutBusy}
        onCommissionTransaction={applyCommissionPayload}
        onCheckout={async (body) => {
          setDataBundleCheckoutBusy(true);
          try {
            return await startCheckout(body);
          } catch (e) {
            toast.error(failMsg(e));
            return { recipientName: null };
          } finally {
            setDataBundleCheckoutBusy(false);
          }
        }}
        onPayDirect={runPayDirect}
        payDirectBusy={payDirectBusy}
      />

      <HubtelEcgPrepaidCard
        checkoutBusy={ecgCheckoutBusy}
        anyCheckoutBusy={anyCheckoutBusy}
        onCommissionTransaction={applyCommissionPayload}
        onCheckout={async (body) => {
          setEcgCheckoutBusy(true);
          try {
            await startCheckout(body);
          } catch (e) {
            toast.error(failMsg(e));
          } finally {
            setEcgCheckoutBusy(false);
          }
        }}
        onPayDirect={runPayDirect}
        payDirectBusy={payDirectBusy}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utilities and TV (query, then checkout)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Water (Ghana Water) or TV products. For <strong>ECG electricity prepaid</strong>, use the card above. Run{" "}
            <strong>Query</strong> first when you need balance or session details, then enter amount and pay.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="util-service">Service</Label>
              <select
                id="util-service"
                className="border-input bg-background h-9 w-full max-w-md rounded-md border px-3 text-sm"
                value={utilService}
                onChange={(e) => {
                  setUtilService(e.target.value as UtilityServiceKey);
                }}
              >
                <option value="ghana_water">Water (Ghana Water)</option>
                <option value="dstv">DSTV</option>
                <option value="gotv">GOtv</option>
                <option value="startimes">StarTimes</option>
                <option value="telecel_postpaid">Telecel Postpaid</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="util-ref">Reference (phone, meter, or account)</Label>
              <Input
                id="util-ref"
                value={utilRef}
                onChange={(e) => {
                  setUtilRef(e.target.value);
                }}
                placeholder="e.g. meter number, account, or mobile"
              />
            </div>
            {utilService === "ghana_water" && (
              <div className="space-y-2">
                <Label htmlFor="util-mobile">Mobile (optional, water query)</Label>
                <Input
                  id="util-mobile"
                  value={utilMobile}
                  onChange={(e) => {
                    setUtilMobile(e.target.value);
                  }}
                  placeholder="Ghana Water query"
                />
              </div>
            )}
            {utilService === "ghana_water" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="util-email">Email (from query)</Label>
                  <Input
                    id="util-email"
                    type="email"
                    value={utilEmail}
                    onChange={(e) => {
                      setUtilEmail(e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="util-session">Session ID (from query)</Label>
                  <Input
                    id="util-session"
                    value={utilSessionId}
                    onChange={(e) => {
                      setUtilSessionId(e.target.value);
                    }}
                  />
                </div>
              </>
            )}
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={utilityQuerying}
              aria-busy={utilityQuerying}
              onClick={async () => {
                try {
                  if (!utilRef.trim()) {
                    toast.error("Enter a reference first.");
                    return;
                  }
                  const body = buildUtilityQueryPayload(utilService, utilRef, utilMobile);
                  const payload = await qUtil(body).unwrap();
                  toast.success("Query completed. Check the Network tab for the full JSON response.");
                } catch (error) {
                  toast.error(failMsg(error));
                }
              }}
            >
              {utilityQuerying ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Querying…
                </>
              ) : (
                "Query"
              )}
            </Button>
            <Button
              type="button"
              disabled={utilityCheckoutBusy || anyCheckoutBusy}
              aria-busy={utilityCheckoutBusy}
              onClick={async () => {
                setUtilityCheckoutBusy(true);
                try {
                  await submitUtilityOrTvCheckout({
                    utilService,
                    utilRef,
                    utilMobile,
                    utilAmount,
                    utilMeter,
                    utilEmail,
                    utilSessionId,
                    startCheckout,
                  });
                } catch (error) {
                  toast.error(failMsg(error));
                } finally {
                  setUtilityCheckoutBusy(false);
                }
              }}
            >
              {utilityCheckoutBusy ? (
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
                void runPayDirect(
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

      {lastCsTransaction?.client_reference ? (
        <HubtelTestFollowup
          transaction={lastCsTransaction}
          statusChecking={hubtelStatusChecking}
          autoPolling={hubtelAutoPolling}
          hubtelStatusLabel={hubtelStatusLabel}
          onCheckStatus={async () => {
            const ref = lastCsTransaction.client_reference;
            if (!ref) {
              return;
            }
            await checkHubtelTransactionStatus(ref);
          }}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync pending Hubtel records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Re-checks older <strong>pending</strong> Hubtel prepaid transactions against Hubtel&apos;s status API so
            stuck rows can move to success or failed (useful if a callback was missed).
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={hubtelSyncing}
            aria-busy={hubtelSyncing}
            onClick={async () => {
              try {
                await sync().unwrap();
                toast.success("Sync invoked.");
              } catch (error) {
                toast.error(failMsg(error));
              }
            }}
          >
            {hubtelSyncing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Syncing…
              </>
            ) : (
              "Run sync-pending"
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={checkoutOpen}
        onOpenChange={(open) => {
          setCheckoutOpen(open);
        }}
      >
        <DialogContent className="w-[min(96vw,1320px)] max-w-none gap-4">
          <DialogHeader>
            <DialogTitle>Payment &amp; order status</DialogTitle>
          </DialogHeader>
          {orderUuid && !checkoutUrl ? (
            <div className="space-y-3">
              {hubtelStatusLabel ? (
                <section className="border-border rounded-md border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Hubtel payment: </span>
                  <span className="font-medium">{hubtelStatusLabel}</span>
                  {hubtelAutoPolling ? (
                    <Loader2
                      className="text-muted-foreground ml-2 inline size-3.5 animate-spin align-middle"
                      aria-hidden="true"
                    />
                  ) : null}
                </section>
              ) : null}
              {liveOrderStatus ? (
                <section
                  className="border-border rounded-md border px-3 py-2 text-sm"
                  aria-live="polite"
                  aria-busy={orderLiveFetching && orderPollingActive}
                >
                  <span className="text-muted-foreground">
                    {orderPollingActive ? "Order status (syncs every 5s): " : "Order status: "}
                  </span>
                  <span className="font-medium">{liveOrderStatus}</span>
                  {orderLiveFetching && orderPollingActive ? (
                    <Loader2
                      className="text-muted-foreground ml-2 inline size-3.5 animate-spin align-middle"
                      aria-hidden="true"
                    />
                  ) : null}
                </section>
              ) : orderPollingActive ? (
                <section
                  className="border-border text-muted-foreground rounded-md border px-3 py-2 text-sm"
                  aria-live="polite"
                  aria-busy={orderLiveFetching}
                >
                  Checking order status…
                </section>
              ) : null}
              {liveOrderMeter ? (
                <section className="border-border rounded-md border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Meter: </span>
                  <span className="font-mono font-medium">{liveOrderMeter}</span>
                </section>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!orderUuid || orderStatusFetching}
                  aria-busy={orderStatusFetching}
                  onClick={async () => {
                    if (!orderUuid) return;
                    try {
                      const res = await getStatus({ uuid: orderUuid }).unwrap();
                      const refreshed = readServiceOrderStatus(res);
                      if (refreshed) {
                        setTrackedOrderStatus(refreshed);
                      }
                      toast.success(formatOrderStatusToast(res));
                    } catch (error) {
                      toast.error(failMsg(error));
                    }
                  }}
                >
                  Refresh order status
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Direct MoMo: approve the prompt on the payer phone. Payment is polled until Hubtel
                reports <strong>Paid</strong>; the order only moves to delivered after payment is
                confirmed on the server.
              </p>
            </div>
          ) : checkoutUrl ? (
            <div className="space-y-3">
              {liveOrderStatus ? (
                <section
                  className="border-border rounded-md border px-3 py-2 text-sm"
                  aria-live="polite"
                  aria-busy={orderLiveFetching && orderPollingActive}
                >
                  <span className="text-muted-foreground">
                    {orderPollingActive ? "Order status (syncs every 5s): " : "Order status: "}
                  </span>
                  <span className="text-foreground font-medium">{liveOrderStatus}</span>
                  {orderLiveFetching && orderPollingActive ? (
                    <Loader2
                      className="text-muted-foreground ml-2 inline size-3.5 animate-spin align-middle"
                      aria-hidden="true"
                    />
                  ) : null}
                </section>
              ) : orderPollingActive ? (
                <section
                  className="border-border text-muted-foreground rounded-md border px-3 py-2 text-sm"
                  aria-live="polite"
                  aria-busy={orderLiveFetching}
                >
                  Checking order status…
                </section>
              ) : null}
              {liveOrderMeter ? (
                <section className="border-border rounded-md border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Meter: </span>
                  <span className="font-mono font-medium">{liveOrderMeter}</span>
                </section>
              ) : null}
              <div className="bg-muted overflow-hidden rounded-md border">
                <iframe
                  title="Hubtel checkout"
                  src={checkoutUrl}
                  className="h-[min(416px,56vh)] w-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  Open in new tab
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!orderUuid || orderStatusFetching}
                  aria-busy={orderStatusFetching}
                  onClick={async () => {
                    if (!orderUuid) return;
                    try {
                      const res = await getStatus({ uuid: orderUuid }).unwrap();
                      const refreshed = readServiceOrderStatus(res);
                      if (refreshed) {
                        setTrackedOrderStatus(refreshed);
                      }
                      toast.success(formatOrderStatusToast(res));
                    } catch (error) {
                      toast.error(failMsg(error));
                    }
                  }}
                >
                  {orderStatusFetching ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                      Refreshing…
                    </>
                  ) : (
                    "Refresh order status"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!checkoutId || paymentStatusFetching}
                  aria-busy={paymentStatusFetching}
                  onClick={async () => {
                    if (!checkoutId) return;
                    try {
                      const res = await getPaymentStatus({ checkoutId }).unwrap();
                      toast.success(formatPaymentStatusToast(res));
                    } catch (error) {
                      toast.error(failMsg(error));
                    }
                  }}
                >
                  {paymentStatusFetching ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                      Checking…
                    </>
                  ) : (
                    "Payment status check"
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                If the iframe blocks payment, use &quot;Open in new tab&quot;.
              </p>
            </div>
          ) : (
            <div
              className="text-muted-foreground text-sm"
              aria-busy="true"
              aria-live="polite"
            >
              Preparing checkout…
            </div>
          )}
        </DialogContent>
      </Dialog>
    </article>
  );
}

function safeGetString(value: unknown, path: string): string | null {
  if (!value || typeof value !== "object") return null;
  const keys = path.split(".");
  let current: unknown = value;
  for (const k of keys) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[k];
  }
  return typeof current === "string" && current.trim() ? current : null;
}

function safeGetNumber(value: unknown, key: string): number | null {
  if (!value || typeof value !== "object") return null;
  const raw = (value as Record<string, unknown>)[key];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function safeGetArray(value: unknown, path: string): unknown[] | null {
  if (!value || typeof value !== "object") return null;
  const keys = path.split(".");
  let current: unknown = value;
  for (const k of keys) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[k];
  }
  return Array.isArray(current) ? current : null;
}

function buildUtilityQueryPayload(
  service: UtilityServiceKey,
  ref: string,
  mobile: string,
): Record<string, unknown> {
  const destination = ref.trim();
  if (!destination) {
    return { service, destination: "" };
  }
  if (service === "ghana_water") {
    return { service, destination, mobile: mobile.trim() || destination };
  }
  return { service, destination };
}

function buildUtilityPayDirectBody(args: {
  utilService: UtilityServiceKey;
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

  if (utilService === "ecg" && !utilMeter.trim()) {
    toast.error("ECG needs a meter number for payment.");
    return null;
  }

  if (utilService === "ghana_water" && (!utilEmail.trim() || !utilSessionId.trim())) {
    toast.error("Ghana Water needs email and session id from the query step.");
    return null;
  }

  const metadata: Record<string, unknown> = {};
  if (utilService === "ecg") {
    metadata.customer_phone = ref;
    metadata.meter_number = utilMeter.trim();
  } else if (utilService === "ghana_water") {
    metadata.customer_phone = utilMobile.trim() || ref;
    metadata.meter_number = utilMeter.trim() || ref;
    metadata.email = utilEmail.trim();
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
  utilService: UtilityServiceKey;
  utilRef: string;
  utilMobile: string;
  utilAmount: string;
  utilMeter: string;
  utilEmail: string;
  utilSessionId: string;
  startCheckout: (
    body: Record<string, unknown>,
  ) => Promise<{ recipientName: string | null }>;
}): Promise<void> {
  const {
    utilService,
    utilRef,
    utilMobile,
    utilAmount,
    utilMeter,
    utilEmail,
    utilSessionId,
    startCheckout,
  } = args;

  const ref = utilRef.trim();
  const amt = Number(utilAmount);

  if (!ref || !Number.isFinite(amt) || amt <= 0) {
    toast.error("Enter reference and a valid amount.");
    return;
  }

  if (utilService === "ecg" && !utilMeter.trim()) {
    toast.error("ECG needs a meter number for payment.");
    return;
  }

  if (utilService === "ghana_water" && (!utilEmail.trim() || !utilSessionId.trim())) {
    toast.error("Ghana Water needs email and session id from the query step.");
    return;
  }

  const product = utilService;
  const metadata: Record<string, unknown> = {};

  if (utilService === "ecg") {
    metadata.customer_phone = ref;
    metadata.meter_number = utilMeter.trim();
  } else if (utilService === "ghana_water") {
    metadata.customer_phone = utilMobile.trim() || ref;
    metadata.meter_number = utilMeter.trim() || ref;
    metadata.email = utilEmail.trim();
    metadata.session_id = utilSessionId.trim();
  }

  await startCheckout({
    product,
    recipient: ref,
    delivery_amount: amt,
    charged_amount: amt,
    description: `${product} for ${ref}`,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  });
}

function formatOrderStatusToast(res: unknown): string {
  const flat = flattenApiData(res);
  const status = typeof flat?.status === "string" ? flat.status : "unknown";
  const err = typeof flat?.error_message === "string" ? flat.error_message : "";
  return err ? `Order status: ${status} — ${err}` : `Order status: ${status}`;
}

function formatPaymentStatusToast(res: unknown): string {
  const flat = flattenApiData(res);
  const hubtel = typeof flat?.hubtel_status === "string" ? flat.hubtel_status : "";
  const orderStatus =
    typeof flat?.order_status === "string" ? flat.order_status : "";
  const parts = ["Payment check"];
  if (hubtel) parts.push(hubtel);
  if (orderStatus) parts.push(`order ${orderStatus}`);
  return parts.join(" · ");
}
