"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  extractHubtelStatusCheckResult,
  isHubtelPaymentCheckTerminal,
  isHubtelTransactionPending,
  mergeHubtelStatusCheckIntoTransaction,
  type HubtelTransactionSnapshot,
} from "@/lib/admin-api-envelope";
import { useHubtelStatusCheckMutation } from "@/store/admin-api";

const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_FIRST_POLL_DELAY_MS = 2000;
const DEFAULT_MAX_ATTEMPTS = 36;

type UseHubtelTransactionPollOptions = {
  transaction: HubtelTransactionSnapshot | null;
  onTransactionUpdate: (transaction: HubtelTransactionSnapshot) => void;
  onStatusLabelUpdate?: (label: string | null) => void;
  pollIntervalMs?: number;
  firstPollDelayMs?: number;
  maxAttempts?: number;
  showTerminalToast?: boolean;
};

export function useHubtelTransactionPoll({
  transaction,
  onTransactionUpdate,
  onStatusLabelUpdate,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  firstPollDelayMs = DEFAULT_FIRST_POLL_DELAY_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  showTerminalToast = true,
}: UseHubtelTransactionPollOptions): { polling: boolean } {
  const [hubtelStatusCheck] = useHubtelStatusCheckMutation();
  const [polling, setPolling] = useState(false);
  const attemptsRef = useRef(0);
  const terminalToastShownRef = useRef<string | null>(null);

  useEffect(() => {
    terminalToastShownRef.current = null;
  }, [transaction?.client_reference]);

  useEffect(() => {
    const clientReference = transaction?.client_reference;
    const status = transaction?.status?.toLowerCase() ?? "";
    const pending =
      isHubtelTransactionPending(transaction) &&
      status !== "success" &&
      transaction?.response_code !== "0000";
    if (!clientReference || !pending) {
      setPolling(false);
      attemptsRef.current = 0;
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    setPolling(true);
    attemptsRef.current = 0;

    async function pollOnce(): Promise<boolean> {
      if (cancelled || attemptsRef.current >= maxAttempts || !transaction) {
        return true;
      }
      attemptsRef.current += 1;

      try {
        const payload = await hubtelStatusCheck({ client_reference: clientReference }).unwrap();
        const result = extractHubtelStatusCheckResult(payload);
        const snapshot = mergeHubtelStatusCheckIntoTransaction(transaction, payload);
        onTransactionUpdate(snapshot);
        if (result.hubtelStatusLabel) {
          onStatusLabelUpdate?.(result.hubtelStatusLabel);
        }

        const paymentTerminal = isHubtelPaymentCheckTerminal(payload);
        if (!isHubtelTransactionPending(snapshot) || paymentTerminal) {
          const terminalKey = `${snapshot.client_reference}:${snapshot.status}:${result.hubtelStatusLabel ?? ""}`;
          if (showTerminalToast && terminalToastShownRef.current !== terminalKey) {
            terminalToastShownRef.current = terminalKey;
            const status = snapshot.status?.toLowerCase() ?? "";
            const hubtelLabel = result.hubtelStatusLabel?.toLowerCase() ?? "";
            if (
              status === "success" ||
              status === "delivered" ||
              hubtelLabel === "paid"
            ) {
              toast.success("Hubtel payment confirmed.");
            } else if (status === "failed" || hubtelLabel === "failed") {
              toast.error("Hubtel payment failed.");
            }
          }
          return true;
        }
      } catch {
        // Keep polling until max attempts — callback may arrive slightly later.
      }

      return attemptsRef.current >= maxAttempts;
    }

    async function startPolling(): Promise<void> {
      const stopAfterFirst = await pollOnce();
      if (cancelled || stopAfterFirst) {
        setPolling(false);
        return;
      }

      intervalId = setInterval(() => {
        void pollOnce().then((shouldStop) => {
          if (shouldStop && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
            setPolling(false);
          }
        });
      }, pollIntervalMs);
    }

    const firstPollTimer = setTimeout(() => {
      void startPolling();
    }, firstPollDelayMs);

    return () => {
      cancelled = true;
      clearTimeout(firstPollTimer);
      if (intervalId) {
        clearInterval(intervalId);
      }
      setPolling(false);
    };
  }, [
    transaction?.client_reference,
    transaction?.status,
    transaction?.response_code,
    hubtelStatusCheck,
    onTransactionUpdate,
    onStatusLabelUpdate,
    pollIntervalMs,
    firstPollDelayMs,
    maxAttempts,
    showTerminalToast,
  ]);

  return { polling };
}
