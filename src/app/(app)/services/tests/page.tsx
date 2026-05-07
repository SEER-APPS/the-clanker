"use client";

import { useGetServiceTestsMetaQuery, usePostServiceTestAirtimeMutation, usePostServiceTestBundlesMutation, usePostServiceTestDataTopupMutation } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function ServiceTestsPage(): React.ReactElement {
  const { data: meta } = useGetServiceTestsMetaQuery();
  const [airtime, { isLoading: aBusy }] = usePostServiceTestAirtimeMutation();
  const [bundles, { isLoading: bBusy }] = usePostServiceTestBundlesMutation();
  const [dataTop, { isLoading: dBusy }] = usePostServiceTestDataTopupMutation();
  const [operatorId, setOperatorId] = useState("");
  const [countryIso, setCountryIso] = useState(
    String((meta as { country_iso?: string } | undefined)?.country_iso ?? "GH"),
  );
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("GHS");
  const [bundleCode, setBundleCode] = useState("");
  const [out, setOut] = useState<unknown>(null);

  async function runAirtime(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    try {
      const res = await airtime({
        operator_id: Number(operatorId),
        country_iso: countryIso,
        recipient_phone: recipient,
        amount: Number(amount),
        currency,
      }).unwrap();
      setOut(res);
      toast.success("Airtime test sent.");
    } catch (err: unknown) {
      toast.error(parseErr(err));
    }
  }

  async function runBundles(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    try {
      const res = await bundles({ operator_id: Number(operatorId) }).unwrap();
      setOut(res);
      toast.success("Bundles loaded.");
    } catch (err: unknown) {
      toast.error(parseErr(err));
    }
  }

  async function runData(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    try {
      const res = await dataTop({
        operator_id: Number(operatorId),
        country_iso: countryIso,
        recipient_phone: recipient,
        amount: Number(amount),
        currency,
        bundle_product_code: bundleCode,
      }).unwrap();
      setOut(res);
      toast.success("Data top-up test sent.");
    } catch (err: unknown) {
      toast.error(parseErr(err));
    }
  }

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Reloadly service tests</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Safe admin-only probes. Default country {String(meta?.country_iso ?? "GH")}.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shared fields</CardTitle>
        </CardHeader>
        <CardContent className="grid max-w-xl gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="st-op">Operator ID</Label>
            <Input
              id="st-op"
              value={operatorId}
              onChange={(e) => {
                setOperatorId(e.target.value);
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-iso">Country ISO</Label>
            <Input
              id="st-iso"
              value={countryIso}
              onChange={(e) => {
                setCountryIso(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-phone">Recipient phone</Label>
            <Input
              id="st-phone"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Airtime test</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-xl gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              void runAirtime(e);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="st-amt">Amount</Label>
              <Input
                id="st-amt"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-cur">Currency</Label>
              <Input
                id="st-cur"
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                }}
                required
              />
            </div>
            <Button
              type="submit"
              className="md:col-span-2"
              disabled={aBusy}
            >
              Run airtime
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bundles list</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              void runBundles(e);
            }}
          >
            <Button
              type="submit"
              disabled={bBusy}
            >
              Load bundles
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data top-up test</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-xl gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              void runData(e);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="st-d-amt">Amount</Label>
              <Input
                id="st-d-amt"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-d-cur">Currency</Label>
              <Input
                id="st-d-cur"
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                }}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="st-bundle">Bundle product code</Label>
              <Input
                id="st-bundle"
                value={bundleCode}
                onChange={(e) => {
                  setBundleCode(e.target.value);
                }}
                required
              />
            </div>
            <Button
              type="submit"
              className="md:col-span-2"
              disabled={dBusy}
            >
              Run data top-up
            </Button>
          </form>
        </CardContent>
      </Card>

      {out !== null ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted max-h-96 overflow-auto rounded-md p-3 font-mono text-xs">
              {JSON.stringify(out, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
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
