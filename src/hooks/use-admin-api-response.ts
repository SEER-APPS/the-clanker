"use client";

import { useCallback, useState } from "react";
import { extractMutationErrorPayload } from "@/lib/admin-api-envelope";

export type RecordedApiResponse = {
  label: string;
  outcome: "success" | "error";
  recordedAt: string;
  payload: unknown;
};

export function useAdminApiResponse(): {
  lastResponse: RecordedApiResponse | null;
  recordSuccess: (label: string, payload: unknown) => void;
  recordError: (label: string, error: unknown) => void;
  clearResponse: () => void;
} {
  const [lastResponse, setLastResponse] = useState<RecordedApiResponse | null>(null);

  const recordSuccess = useCallback((label: string, payload: unknown) => {
    setLastResponse({
      label,
      outcome: "success",
      recordedAt: new Date().toISOString(),
      payload,
    });
  }, []);

  const recordError = useCallback((label: string, error: unknown) => {
    setLastResponse({
      label,
      outcome: "error",
      recordedAt: new Date().toISOString(),
      payload: extractMutationErrorPayload(error),
    });
  }, []);

  const clearResponse = useCallback(() => {
    setLastResponse(null);
  }, []);

  return { lastResponse, recordSuccess, recordError, clearResponse };
}
