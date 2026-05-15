"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  PAYMENT_POLL_MAX_UUID_ATTEMPTS,
  PAYMENT_STATUS_MAX_ATTEMPTS,
  POLL_BY_UUID_INTERVAL_MS,
  POLL_INITIAL_DELAY_MS,
  RESOLVE_CHECKOUT_INTERVAL_MS,
  fetchOrderByUuid,
  fetchPaymentStatusHubtel,
  readCheckoutIdFromParams,
  readOrderUuidFromParams,
  postCompleteFromReturn,
  resolveOrderUuidByCheckout,
} from "@/lib/payment-return-polling";
import { getSeerPublicBackendUrl } from "@/lib/seer-public-backend-url";
import type { PaymentReturnOrderSnapshot } from "@/types/payment-return.types";

type PaymentBadgeKind = string;

export function PaymentReturnClient(): React.ReactElement {
  const searchParams = useSearchParams();
  const backend = useMemo(() => getSeerPublicBackendUrl(), []);
  const checkoutId = useMemo(
    () => readCheckoutIdFromParams(searchParams),
    [searchParams],
  );
  const initialOrderUuid = useMemo(
    () => readOrderUuidFromParams(searchParams),
    [searchParams],
  );

  if (!checkoutId && !initialOrderUuid) {
    return (
      <PaymentReturnLayout
        footer={
          <FatalNotice message="We could not read your payment session. Open this page from your return link." />
        }
      />
    );
  }

  return (
    <PaymentReturnLayout
      footer={
        <PaymentReturnPollerBody
          backend={backend}
          checkoutId={checkoutId}
          initialOrderUuid={initialOrderUuid}
        />
      }
    />
  );
}

function PaymentReturnLayout({
  childrenPreNote,
  footer,
}: {
  childrenPreNote?: React.ReactNode;
  footer: React.ReactNode;
}): React.ReactElement {
  const linkBtn = buttonVariants({ variant: "default", size: "default" });
  const linkBtnOutline = buttonVariants({ variant: "outline", size: "default" });

  return (
    <main className="bg-muted/30 flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-lg border shadow-sm">
        <CardHeader className="text-center">
          <div
            className="border-foreground mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2"
            aria-hidden="true"
          >
            <Check className="h-6 w-6" strokeWidth={2} />
          </div>
          <CardTitle className="text-xl font-semibold">Payment return</CardTitle>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            If your payment succeeded, we deliver the service next. This page
            checks your order status automatically.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {childrenPreNote}
          {footer}
          <nav className="flex flex-wrap justify-center gap-2 pt-2">
            <Link href="/dashboard" className={cn(linkBtn)}>
              Back to dashboard
            </Link>
            <Link href="/services/hubtel/tests" className={cn(linkBtnOutline)}>
              Hubtel tools
            </Link>
          </nav>
        </CardContent>
      </Card>
    </main>
  );
}

function FatalNotice({ message }: { message: string }): React.ReactElement {
  return (
    <section
      className="border-destructive/30 bg-destructive/10 rounded-md border p-3 text-left text-xs text-destructive"
      role="alert"
    >
      {message}
    </section>
  );
}

function PaymentReturnPollerBody({
  backend,
  checkoutId,
  initialOrderUuid,
}: {
  backend: string;
  checkoutId: string | null;
  initialOrderUuid: string | null;
}): React.ReactElement {
  const [snapshot, setSnapshot] = useState<PaymentReturnOrderSnapshot | null>(
    null,
  );
  const [paymentKind, setPaymentKind] =
    useState<PaymentBadgeKind>("unconfirmed");
  const [pollingText, setPollingText] = useState(
    initialOrderUuid ? "Starting status check…" : "Looking up your order…",
  );
  const [pollingDone, setPollingDone] = useState(false);
  const [pollingTone, setPollingTone] = useState<"muted" | "success" | "fail">(
    "muted",
  );

  const uuidRef = useRef<string | null>(initialOrderUuid);
  const resolveAttemptsRef = useRef(0);
  const pollAttemptsRef = useRef(0);
  const paymentStatusAttemptsRef = useRef(0);
  const skipPaymentStatusRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    uuidRef.current = initialOrderUuid;
    resolveAttemptsRef.current = 0;
    pollAttemptsRef.current = 0;
    paymentStatusAttemptsRef.current = 0;
    skipPaymentStatusRef.current = false;

    const timers = timersRef;
    function clearTimers(): void {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    }

    let cancelled = false;
    clearTimers();

    if (checkoutId) {
      void postCompleteFromReturn(backend, checkoutId);
    }

    function schedule(fn: () => void, ms: number): void {
      const id = setTimeout(() => {
        if (!cancelled) void fn();
      }, ms);
      timers.current.push(id);
    }

    function setBadgeFromHubtel(hubtel: string): void {
      const normalized = hubtel ? hubtel.toLowerCase() : "";
      if (normalized === "paid") {
        setPaymentKind("paid");
      } else if (normalized === "unpaid" || normalized === "refunded") {
        setPaymentKind(normalized || "unpaid");
      } else {
        setPaymentKind(hubtel || "unconfirmed");
      }
    }

    function applyOrderStatusToUi(status: string, errorMessage?: string): boolean {
      if (status === "delivered") {
        setPollingText("Service delivered successfully.");
        setPollingDone(true);
        setPollingTone("success");
        setPaymentKind("paid");
        return true;
      }
      if (status === "paid" || status === "delivering") {
        setPaymentKind("paid");
        return false;
      }
      if (status === "failed") {
        setPollingText(`Delivery failed: ${errorMessage ?? "see support."}`);
        setPollingDone(true);
        setPollingTone("fail");
        return true;
      }
      return false;
    }

    async function pollPaymentSide(): Promise<void> {
      const cid = checkoutId;
      if (!cid || cancelled || skipPaymentStatusRef.current) return;
      if (paymentStatusAttemptsRef.current >= PAYMENT_STATUS_MAX_ATTEMPTS) {
        skipPaymentStatusRef.current = true;
        return;
      }
      paymentStatusAttemptsRef.current += 1;

      const { hubtelStatus, ok, statusApiUnavailable, orderStatus } =
        await fetchPaymentStatusHubtel(backend, cid);
      if (cancelled) return;

      if (statusApiUnavailable || !ok) {
        skipPaymentStatusRef.current = true;
        if (orderStatus) {
          applyOrderStatusToUi(orderStatus);
        }
        return;
      }

      setBadgeFromHubtel(hubtelStatus);
      if (orderStatus) {
        applyOrderStatusToUi(orderStatus);
      }
    }

    async function pollByUuid(): Promise<void> {
      const uuid = uuidRef.current;
      if (!uuid || cancelled) return;
      if (pollAttemptsRef.current++ > PAYMENT_POLL_MAX_UUID_ATTEMPTS) {
        setPollingText(
          "Still waiting — refresh this page or check the admin panel.",
        );
        setPollingDone(true);
        setPollingTone("fail");
        return;
      }

      try {
        await pollPaymentSide();
        const res = await fetchOrderByUuid(backend, uuid);
        if (cancelled) return;
        if (!res.ok) {
          setPollingText("Status check failed — retrying…");
          schedule(pollByUuid, POLL_BY_UUID_INTERVAL_MS);
          return;
        }

        setPollingText(
          `Status: ${res.status} (updated ${new Date().toLocaleTimeString()})`,
        );

        setSnapshot((prev) => ({
          product: res.product ?? prev?.product ?? "",
          recipient: res.recipient ?? prev?.recipient ?? "",
          chargedAmount: res.chargedAmount ?? prev?.chargedAmount ?? 0,
          status: res.status as PaymentReturnOrderSnapshot["status"],
          meterNumber: res.meterNumber ?? prev?.meterNumber,
          linkedMobile: res.linkedMobile ?? prev?.linkedMobile,
        }));

        if (res.status === "pending_payment") {
          setPaymentKind("unconfirmed");
        } else if (res.status === "paid" || res.status === "delivering") {
          setPaymentKind("paid");
        }

        if (applyOrderStatusToUi(res.status, res.errorMessage)) {
          return;
        }

        if (
          skipPaymentStatusRef.current &&
          (res.status === "paid" || res.status === "delivering") &&
          pollAttemptsRef.current >= PAYMENT_STATUS_MAX_ATTEMPTS
        ) {
          setPollingText("Service delivered successfully.");
          setPollingDone(true);
          setPollingTone("success");
          return;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        setPollingText(`Network error — retrying… (${msg})`);
      }
      schedule(pollByUuid, POLL_BY_UUID_INTERVAL_MS);
    }

    async function resolveCheckoutThenPoll(): Promise<void> {
      const cid = checkoutId;
      if (!cid || cancelled) return;
      if (resolveAttemptsRef.current++ > PAYMENT_POLL_MAX_UUID_ATTEMPTS) {
        setPollingText(
          "Could not find your order. Check the admin panel or contact support with your checkout ID.",
        );
        setPollingDone(true);
        setPollingTone("fail");
        return;
      }

      try {
        await pollPaymentSide();
        const resolved = await resolveOrderUuidByCheckout(backend, cid);
        if (cancelled) return;
        if (resolved.ok && resolved.orderUuid) {
          uuidRef.current = resolved.orderUuid;
          setPollingText("Order found — tracking delivery…");
          pollAttemptsRef.current = 0;
          schedule(pollByUuid, POLL_INITIAL_DELAY_MS);
          return;
        }
        setPollingText(
          `Waiting for order record… (${resolved.message ?? "not yet"})`,
        );
      } catch {
        setPollingText("Lookup error — retrying…");
      }
      schedule(resolveCheckoutThenPoll, RESOLVE_CHECKOUT_INTERVAL_MS);
    }

    if (initialOrderUuid) {
      schedule(pollByUuid, POLL_INITIAL_DELAY_MS);
    } else if (checkoutId) {
      schedule(resolveCheckoutThenPoll, POLL_INITIAL_DELAY_MS);
    }

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [backend, checkoutId, initialOrderUuid]);

  const orderBadgeClass = orderStatusBadgeClass(snapshot?.status ?? "");
  const paymentBadgeClass = paymentBadgeClassForKind(paymentKind);

  return (
    <>
      {snapshot ? (
        <section
          className="divide-border divide-y text-sm"
          aria-label="Order details"
        >
          <DetailRow label="Service" value={snapshot.product.toUpperCase()} />
          <DetailRow label="Recipient" value={snapshot.recipient} />
          <DetailRow
            label="Checkout amount"
            value={`GHS ${snapshot.chargedAmount.toFixed(2)}`}
          />
          <DetailRow
            label="Order status"
            value={<span className={orderBadgeClass}>{snapshot.status}</span>}
          />
          {snapshot.meterNumber ? (
            <DetailRow label="Meter number" value={<span className="font-mono">{snapshot.meterNumber}</span>} />
          ) : null}
          {snapshot.linkedMobile ? (
            <DetailRow label="Linked mobile" value={<span className="font-mono">{snapshot.linkedMobile}</span>} />
          ) : null}
          <DetailRow
            label="Payment status"
            value={<span className={paymentBadgeClass}>{paymentKind}</span>}
          />
        </section>
      ) : checkoutId ? (
        <p className="text-muted-foreground text-sm">
          Resolving your order from the payment provider…
        </p>
      ) : null}

      {!pollingDone ? (
        <section
          className="bg-muted/60 border-border rounded-md border p-3 text-left text-xs text-muted-foreground"
          aria-live="polite"
          aria-busy="true"
        >
          <span
            className="border-foreground mr-2 inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-t-transparent align-middle"
            aria-hidden="true"
          />
          {pollingText}
        </section>
      ) : pollingTone !== "muted" ? (
        <section
          className={`rounded-md border p-3 text-left text-xs ${
            pollingTone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
          role="status"
        >
          {pollingText}
        </section>
      ) : (
        <p className="text-muted-foreground text-xs">{pollingText}</p>
      )}
    </>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function orderStatusBadgeClass(status: string): string {
  if (status === "delivered") {
    return "inline-flex rounded border border-foreground bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";
  }
  if (status === "paid" || status === "delivering") {
    return "inline-flex rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100";
  }
  return "inline-flex rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground";
}

function paymentBadgeClassForKind(kind: PaymentBadgeKind): string {
  const k = kind.toLowerCase();
  if (k === "paid" || k === "confirmed") {
    return "inline-flex rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100";
  }
  return "inline-flex rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground";
}
