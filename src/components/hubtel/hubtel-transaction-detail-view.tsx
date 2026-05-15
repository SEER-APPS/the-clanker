"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HubtelStatusBadge } from "@/components/hubtel/hubtel-status-badge";
import { HubtelDetailSection, type DetailField } from "@/components/hubtel/hubtel-detail-section";

type Presentation = {
  status: string;
  display_status: string;
  status_note: string | null;
  product_label: string;
  summary_fields: DetailField[];
  recipient_fields: DetailField[];
  reference_fields: DetailField[];
  service_order_fields: DetailField[];
  hubtel_response_fields: DetailField[];
  fulfillment_fields: DetailField[];
};

function readPresentation(tx: Record<string, unknown>): Presentation | null {
  const p = tx.presentation;
  if (!p || typeof p !== "object") {
    return null;
  }
  return p as Presentation;
}

export function HubtelTransactionDetailView({
  tx,
}: {
  tx: Record<string, unknown>;
}): React.ReactElement {
  const [showRaw, setShowRaw] = useState(false);
  const presentation = readPresentation(tx);
  const displayStatus = String(tx.display_status ?? presentation?.display_status ?? tx.status ?? "");
  const rawStatus = String(tx.status ?? "");
  const created = String(tx.created_at ?? "—");
  const updated = String(tx.updated_at ?? "—");

  if (!presentation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">Could not parse transaction presentation.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle className="text-lg">{presentation.product_label}</CardTitle>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              {String(tx.client_reference ?? tx.uuid ?? tx.id ?? "")}
            </p>
          </div>
          <HubtelStatusBadge status={displayStatus} />
        </CardHeader>
        <CardContent className="space-y-3">
          {rawStatus !== displayStatus ? (
            <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
              Hubtel row status: <span className="font-mono">{rawStatus}</span> → showing{" "}
              <span className="font-mono">{displayStatus}</span>
              {presentation.status_note ? ` — ${presentation.status_note}` : null}
            </p>
          ) : presentation.status_note ? (
            <p className="text-muted-foreground text-xs">{presentation.status_note}</p>
          ) : null}
          <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
            <span>Created {created}</span>
            {updated !== "—" ? <span>Updated {updated}</span> : null}
          </div>
        </CardContent>
      </Card>

      <HubtelDetailSection title="Summary" fields={presentation.summary_fields} />
      <HubtelDetailSection title="Recipient" fields={presentation.recipient_fields} />
      <HubtelDetailSection title="References" fields={presentation.reference_fields} />
      <HubtelDetailSection title="Service order" fields={presentation.service_order_fields} />
      <HubtelDetailSection title="Hubtel responses" fields={presentation.hubtel_response_fields} />
      <HubtelDetailSection title="Fulfillment" fields={presentation.fulfillment_fields} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Technical payload</CardTitle>
          <button
            type="button"
            className="text-primary text-sm hover:underline"
            onClick={() => {
              setShowRaw((v) => !v);
            }}
          >
            {showRaw ? "Hide" : "Show"} raw JSON
          </button>
        </CardHeader>
        {showRaw ? (
          <CardContent>
            <pre className="bg-muted max-h-[420px] overflow-auto rounded-md p-3 font-mono text-xs">
              {JSON.stringify(tx.response_payload ?? tx, null, 2)}
            </pre>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Raw Hubtel init/callback JSON is available for debugging. Expand only when needed.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
