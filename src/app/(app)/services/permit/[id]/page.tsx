"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useGetPermitAppQuery, useUpdatePermitStatusMutation } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function PermitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  const { id: raw } = use(params);
  const id = Number(raw);
  const { data, isLoading, isError, refetch } = useGetPermitAppQuery(id, { skip: !Number.isFinite(id) });
  const [status, setStatus] = useState("");
  const [update, { isLoading: busy }] = useUpdatePermitStatusMutation();
  const row = data?.application as Record<string, unknown> | undefined;

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
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }
  if (isError || !row) {
    return <p className="text-destructive text-sm">Not found.</p>;
  }

  return (
    <article className="space-y-6">
      <header>
        <Link
          href="/services/permit"
          className="text-muted-foreground text-sm hover:underline"
        >
          Back
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Permit #{id}</h1>
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
              <Label htmlFor="pm-status">Status</Label>
              <Input
                id="pm-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                }}
                placeholder={String(row.status ?? "")}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
            >
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </article>
  );
}
