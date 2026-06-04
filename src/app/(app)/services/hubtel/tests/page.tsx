"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  useHubtelTestSmsMutation,
  useHubtelTestSmsBatchMutation,
  useHubtelTestAirtimeMutation,
  useHubtelStatusCheckMutation,
  useHubtelQueryUtilityMutation,
  useHubtelSyncPendingMutation,
  useHubtelLabConfigQuery,
  useServiceOrderCreateMutation,
  useServiceOrderPayDirectMutation,
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
  const [payDirect, { isLoading: airtimeDirectPayBusy }] = useServiceOrderPayDirectMutation();
  const [airtimeCheckoutBusy, setAirtimeCheckoutBusy] = useState(false);
  const [dataBundleCheckoutBusy, setDataBundleCheckoutBusy] = useState(false);
  const [utilityCheckoutBusy, setUtilityCheckoutBusy] = useState(false);
  const [ecgCheckoutBusy, setEcgCheckoutBusy] = useState(false);
  const anyCheckoutBusy =
    airtimeCheckoutBusy ||
    airtimeDirectPayBusy ||
    dataBundleCheckoutBusy ||
    utilityCheckoutBusy ||
    ecgCheckoutBusy;
  const [getStatus, { isFetching: orderStatusFetching }] = useLazyServiceOrderStatusQuery();
  const [getPaymentStatus, { isFetching: paymentStatusFetching }] =
    useLazyServicePaymentStatusByCheckoutQuery();

  const { data: liveOrder, isFetching: orderLiveFetching } = useServiceOrderStatusQuery(
    { uuid: orderUuid ?? "" },
    {
      skip: !checkoutOpen || !orderUuid,
      // NOTE: don't reference `liveOrder` here; it's in the same const declaration (TDZ).
      pollingInterval: checkoutOpen && orderUuid ? 5000 : 0,
    },
  );

  const deliveredToastPrev = useRef<string | null>(null);
  useEffect(() => {
    deliveredToastPrev.current = null;
  }, [orderUuid]);

  useEffect(() => {
    const prefetch = labConfig?.prefetch_phone?.trim();
    if (prefetch && !airPayeePhone) {
      setAirPayeePhone(prefetch);
    }
  }, [labConfig, airPayeePhone]);

  useEffect(() => {
    if (!checkoutOpen || !liveOrder || typeof liveOrder !== "object" || !("status" in liveOrder)) {
      return;
    }
    const st = String((liveOrder as { status?: unknown }).status);
    if (st === "delivered" && deliveredToastPrev.current !== "delivered") {
      toast.success("Order status: delivered.");
    }
    deliveredToastPrev.current = st;
  }, [checkoutOpen, liveOrder]);

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
      toast.error("Checkout creation succeeded but response was missing checkout URL or order id.");
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
                  void res;
                  toast.success("SMS request finished.");
                } catch (e) {
                  toast.error(failMsg(e));
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
                  const res = await smsBatch({
                    recipients: batchRecipients,
                    message: smsMsg,
                  }).unwrap();
                  void res;
                  toast.success("Batch finished.");
                } catch (e) {
                  toast.error(failMsg(e));
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
                  const res = (await testAirtimeDirect({
                    destination,
                    amount: Number(airAmt),
                    network: airNet,
                  }).unwrap()) as {
                    data?: { transaction?: HubtelTestTransactionSnapshot };
                  };
                  const tx = res.data?.transaction;
                  if (tx) {
                    setLastCsTransaction(tx);
                  }
                  toast.success(
                    `Commission Services accepted (ref ${tx?.client_reference ?? "ok"}).`,
                  );
                } catch (e) {
                  toast.error(failMsg(e));
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
                } catch (e) {
                  toast.error(failMsg(e));
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
              aria-busy={airtimeDirectPayBusy}
              onClick={async () => {
                try {
                  const res = (await payDirect({
                    product: "airtime",
                    network: airNet,
                    recipient: toHubtelInternationalFormat(airDest),
                    delivery_amount: Number(airAmt),
                    charged_amount: Number(airAmt),
                    payer_phone: toHubtelInternationalFormat(airPayeePhone),
                    description: `Airtime for ${toHubtelInternationalFormat(airDest)}`,
                  }).unwrap()) as {
                    data?: { order_uuid?: string; client_reference?: string };
                    message?: string;
                  };
                  const oid = res.data?.order_uuid;
                  if (oid) {
                    setOrderUuid(oid);
                    setCheckoutOpen(true);
                  }
                  toast.success(res.message ?? "MoMo prompt sent. Approve on the payer phone.");
                } catch (e) {
                  toast.error(failMsg(e));
                }
              }}
            >
              {airtimeDirectPayBusy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Sending MoMo prompt…
                </>
              ) : (
                "3. Direct MoMo pay (push prompt) + deliver"
              )}
            </Button>
          </div>
          <div className="md:col-span-3">
            <HubtelTestFollowup
              transaction={lastCsTransaction}
              statusChecking={hubtelStatusChecking}
              hubtelStatusLabel={hubtelStatusLabel}
              onCheckStatus={async () => {
                const ref = lastCsTransaction?.client_reference;
                if (!ref) {
                  return;
                }
                try {
                  const res = (await hubtelStatusCheck({ client_reference: ref }).unwrap()) as {
                    data?: {
                      hubtel?: { data?: { status?: string } };
                      transaction?: HubtelTestTransactionSnapshot;
                    };
                  };
                  const hubtelStatus = res.data?.hubtel?.data?.status;
                  setHubtelStatusLabel(hubtelStatus ?? null);
                  if (res.data?.transaction) {
                    setLastCsTransaction(res.data.transaction);
                  }
                  toast.success(
                    hubtelStatus
                      ? `Hubtel payment status: ${hubtelStatus}`
                      : "Status check completed.",
                  );
                } catch (e) {
                  toast.error(failMsg(e));
                }
              }}
            />
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
      />

      <HubtelEcgPrepaidCard
        checkoutBusy={ecgCheckoutBusy}
        anyCheckoutBusy={anyCheckoutBusy}
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
                  await qUtil(body).unwrap();
                  toast.success("Query completed. Check Hubtel or your server logs for raw results.");
                } catch (e) {
                  toast.error(failMsg(e));
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
                } catch (e) {
                  toast.error(failMsg(e));
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
          </div>
        </CardContent>
      </Card>

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
              } catch (e) {
                toast.error(failMsg(e));
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
              {liveOrder && typeof liveOrder === "object" && liveOrder !== null && "status" in liveOrder ? (
                <section
                  className="border-border rounded-md border px-3 py-2 text-sm"
                  aria-live="polite"
                  aria-busy={orderLiveFetching}
                >
                  <span className="text-muted-foreground">Order status (syncs every 5s): </span>
                  <span className="font-medium">{String((liveOrder as { status?: unknown }).status)}</span>
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
                      toast.success(formatOrderStatusToast(res));
                    } catch (e) {
                      toast.error(failMsg(e));
                    }
                  }}
                >
                  Refresh order status
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Direct MoMo: approve the prompt on the payer phone. Service delivers after Hubtel confirms payment.
              </p>
            </div>
          ) : checkoutUrl ? (
            <div className="space-y-3">
              {liveOrder && typeof liveOrder === "object" && liveOrder !== null && "status" in liveOrder ? (
                <section
                  className="border-border rounded-md border px-3 py-2 text-sm"
                  aria-live="polite"
                  aria-busy={orderLiveFetching}
                >
                  <span className="text-muted-foreground">Order status (syncs every 5s): </span>
                  <span className="text-foreground font-medium">
                    {String((liveOrder as { status?: unknown }).status)}
                  </span>
                  {orderLiveFetching ? (
                    <Loader2
                      className="text-muted-foreground ml-2 inline size-3.5 animate-spin align-middle"
                      aria-hidden="true"
                    />
                  ) : null}
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
                      toast.success(formatOrderStatusToast(res));
                    } catch (e) {
                      toast.error(failMsg(e));
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
                    } catch (e) {
                      toast.error(failMsg(e));
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

function failMsg(e: unknown): string {
  if (e && typeof e === "object" && "data" in e) {
    const m = (e as { data?: { message?: string } }).data?.message;
    if (m) {
      return m;
    }
  }
  return "Request failed.";
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

function flattenApiData(res: unknown): Record<string, unknown> | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const nested = r.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return r;
}

function extractOrderCheckoutFields(res: unknown): {
  orderUuid: string | null;
  checkoutUrl: string | null;
  checkoutId: string | null;
  recipientName: string | null;
} {
  const flat = flattenApiData(res);
  if (!flat) {
    return { orderUuid: null, checkoutUrl: null, checkoutId: null, recipientName: null };
  }

  const orderUuid = typeof flat.order_uuid === "string" ? flat.order_uuid : null;
  const direct =
    typeof flat.checkout_direct_url === "string" ? flat.checkout_direct_url : null;
  const normal = typeof flat.checkout_url === "string" ? flat.checkout_url : null;
  const checkoutUrl = direct ?? normal;

  let checkoutId = typeof flat.checkout_id === "string" ? flat.checkout_id : null;
  if (!checkoutId && checkoutUrl) {
    checkoutId = parseHubtelCheckoutIdFromUrl(checkoutUrl);
  }

  const recipientName =
    typeof flat.recipient_name === "string" && flat.recipient_name.trim()
      ? flat.recipient_name.trim()
      : null;

  return { orderUuid, checkoutUrl, checkoutId, recipientName };
}

function parseHubtelCheckoutIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    if (parts[parts.length - 1] === "direct" && parts.length >= 2) {
      return parts[parts.length - 2] ?? null;
    }
    return parts[parts.length - 1] ?? null;
  } catch {
    return null;
  }
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
