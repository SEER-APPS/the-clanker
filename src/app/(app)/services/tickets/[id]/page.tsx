"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useGetTicketQuery, useUpdateTicketStatusMutation } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AdminDetailPageSkeleton } from "@/components/admin/admin-loading-skeletons";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  const { id: raw } = use(params);
  const id = Number(raw);
  const { data, isLoading, isError, refetch } = useGetTicketQuery(id, { skip: !Number.isFinite(id) });
  const [status, setStatus] = useState("");
  const [update, { isLoading: busy }] = useUpdateTicketStatusMutation();
  const row = data?.booking as Record<string, unknown> | undefined;

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    try {
      await update({ id, body: { status } }).unwrap();
      toast.success("Updated.");
      void refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Failed.")
          : "Failed.";
      toast.error(msg);
    }
  }

  if (!Number.isFinite(id)) {
    return <p className="text-destructive text-sm">Invalid id.</p>;
  }
  if (isLoading) {
    return <AdminDetailPageSkeleton />;
  }
  if (isError || !row) {
    return <p className="text-destructive text-sm">Not found.</p>;
  }

  return (
    <article className="space-y-6">
      <header>
        <Link
          href="/services/tickets"
          className="text-muted-foreground text-sm hover:underline"
        >
          Back
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Ticket #{id}</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Record</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted max-h-96 overflow-auto rounded-md p-3 font-mono text-xs">
            {JSON.stringify(row, null, 2)}
          </pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex max-w-md flex-col gap-3"
            onSubmit={(e) => {
              void onSubmit(e);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="tk-status">Status</Label>
              <Input
                id="tk-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                }}
                placeholder={String(row.status ?? "")}
                required
              />
            </div>
            <Button type="submit" disabled={busy} aria-busy={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </article>
  );
}
