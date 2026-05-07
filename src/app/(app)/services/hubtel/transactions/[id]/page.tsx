"use client";

import { use } from "react";
import Link from "next/link";
import {
  useGetHubtelTransactionQuery,
  useDeleteHubtelTransactionMutation,
  useArchiveHubtelTransactionMutation,
  useRefreshHubtelTransactionMutation,
} from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function HubtelTransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  const { id: raw } = use(params);
  const { data, isLoading, isError, refetch } = useGetHubtelTransactionQuery(raw);
  const [remove, { isLoading: rmBusy }] = useDeleteHubtelTransactionMutation();
  const [archive, { isLoading: arBusy }] = useArchiveHubtelTransactionMutation();
  const [refresh, { isLoading: rfBusy }] = useRefreshHubtelTransactionMutation();

  const tx = data?.transaction as Record<string, unknown> | undefined;

  async function onDelete(): Promise<void> {
    if (!window.confirm("Delete this transaction?")) {
      return;
    }
    try {
      await remove(raw).unwrap();
      toast.success("Deleted.");
      window.location.href = "/services/hubtel/transactions";
    } catch (err: unknown) {
      toast.error(parseErr(err));
    }
  }

  async function onArchive(): Promise<void> {
    try {
      await archive(raw).unwrap();
      toast.success("Archived.");
      void refetch();
    } catch (err: unknown) {
      toast.error(parseErr(err));
    }
  }

  async function onRefresh(): Promise<void> {
    try {
      await refresh(raw).unwrap();
      toast.success("Refresh requested.");
      void refetch();
    } catch (err: unknown) {
      toast.error(parseErr(err));
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }
  if (isError || !tx) {
    return <p className="text-destructive text-sm">Not found.</p>;
  }

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/services/hubtel/transactions"
            className="text-muted-foreground text-sm hover:underline"
          >
            Back to list
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Transaction #{String(tx.id)}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={rfBusy}
            onClick={() => {
              void onRefresh();
            }}
          >
            Refresh status
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={arBusy}
            onClick={() => {
              void onArchive();
            }}
          >
            Archive
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={rmBusy}
            onClick={() => {
              void onDelete();
            }}
          >
            Delete
          </Button>
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payload</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted max-h-[520px] overflow-auto rounded-md p-3 font-mono text-xs">
            {JSON.stringify(tx, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </article>
  );
}

function parseErr(err: unknown): string {
  if (err && typeof err === "object" && "data" in err) {
    const d = (err as { data?: { message?: string } }).data?.message;
    if (d) {
      return d;
    }
  }
  return "Request failed.";
}
