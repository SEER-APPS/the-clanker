"use client";

import { useGetBalancesQuery, useGetReloadlyBalanceQuery, usePostVerifyNumberMutation } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function BalancesPage(): React.ReactElement {
  const { data: summary, isLoading } = useGetBalancesQuery();
  const { data: reloadly, refetch: refetchReloadly } = useGetReloadlyBalanceQuery();
  const [verify, { isLoading: verifying }] = usePostVerifyNumberMutation();
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState("");
  const [mode, setMode] = useState("both");
  const [verifyResult, setVerifyResult] = useState<unknown>(null);

  async function onVerify(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    try {
      const res = await verify({
        phone,
        network: network || undefined,
        mode,
      }).unwrap();
      setVerifyResult(res);
      toast.success("Lookup completed.");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Verify failed.")
          : "Verify failed.";
      toast.error(msg);
    }
  }

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Balances and verification</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Aggregated spend and quick number checks against providers.
        </p>
      </header>

      {isLoading || !summary ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hubtel</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted overflow-auto rounded-md p-3 font-mono text-xs">
                {JSON.stringify(summary.hubtel, null, 2)}
              </pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service orders</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted overflow-auto rounded-md p-3 font-mono text-xs">
                {JSON.stringify(summary.service_orders, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reloadly live balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void refetchReloadly();
            }}
          >
            Refresh
          </Button>
          <pre className="bg-muted overflow-auto rounded-md p-3 font-mono text-xs">
            {JSON.stringify(reloadly ?? {}, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verify number</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-xl gap-3"
            onSubmit={(e) => {
              void onVerify(e);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="v-phone">Phone</Label>
              <Input
                id="v-phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-network">Network (optional)</Label>
              <Input
                id="v-network"
                value={network}
                onChange={(e) => {
                  setNetwork(e.target.value);
                }}
                placeholder="mtn, telecel, at"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-mode">Mode</Label>
              <select
                id="v-mode"
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                }}
              >
                <option value="both">both</option>
                <option value="msisdn">msisdn</option>
                <option value="momo">momo</option>
              </select>
            </div>
            <Button
              type="submit"
              disabled={verifying}
            >
              {verifying ? "Checking…" : "Verify"}
            </Button>
            {verifyResult !== null ? (
              <pre className="bg-muted mt-2 max-h-64 overflow-auto rounded-md p-3 font-mono text-xs">
                {JSON.stringify(verifyResult, null, 2)}
              </pre>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </article>
  );
}
