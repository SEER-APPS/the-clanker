"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isPendingHubtelResponse,
  pendingHubtelResponseHint,
  serializeApiPayloadForDisplay,
} from "@/lib/admin-api-envelope";
import type { RecordedApiResponse } from "@/hooks/use-admin-api-response";

type AdminApiResponsePanelProps = {
  response: RecordedApiResponse | null;
  onClear?: () => void;
};

export function AdminApiResponsePanel({
  response,
  onClear,
}: AdminApiResponsePanelProps): React.ReactElement {
  const pendingHint =
    response?.outcome === "success" && response.payload != null
      ? pendingHubtelResponseHint(response.payload)
      : null;
  const showPendingBanner =
    response?.outcome === "success" && isPendingHubtelResponse(response.payload);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Last API response</CardTitle>
          <p className="text-muted-foreground mt-1 text-xs">
            Sanity check — every successful call (including pending 0001) should show JSON here.
          </p>
        </div>
        {response && onClear ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {!response ? (
          <p className="text-muted-foreground text-sm">
            Run a Hubtel action to see the unwrapped response body from core.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium">{response.label}</span>
              <span
                className={
                  response.outcome === "success"
                    ? showPendingBanner
                      ? "rounded bg-amber-500/15 px-2 py-0.5 text-amber-800 dark:text-amber-200"
                      : "rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-800 dark:text-emerald-200"
                    : "rounded bg-red-500/15 px-2 py-0.5 text-red-800 dark:text-red-200"
                }
              >
                {response.outcome === "success"
                  ? showPendingBanner
                    ? "success · pending"
                    : "success"
                  : "error"}
              </span>
              <span className="text-muted-foreground">{response.recordedAt}</span>
            </div>
            {pendingHint ? (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
                {pendingHint}
              </p>
            ) : null}
            <pre className="bg-muted max-h-[min(420px,50vh)] overflow-auto rounded-md border p-3 text-xs leading-relaxed">
              {serializeApiPayloadForDisplay(response.payload)}
            </pre>
          </>
        )}
      </CardContent>
    </Card>
  );
}
