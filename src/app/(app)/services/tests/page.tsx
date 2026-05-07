"use client";

import {
  useGetReloadlyOperatorsQuery,
  useGetServiceTestsMetaQuery,
  usePostServiceTestAirtimeMutation,
  usePostServiceTestBundlesMutation,
  usePostServiceTestDataTopupMutation,
} from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

type NetworkRow = {
  slug: string;
  label: string;
  operator_id?: number | null;
  data_operator_id?: number | null;
};

type BundlesResponse = { success?: boolean; data?: unknown; message?: string };

function normalizeBundles(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.content)) return r.content;
    if (Array.isArray(r.data)) return r.data;
  }
  return [];
}

export default function ServiceTestsPage(): React.ReactElement {
  const { data: meta } = useGetServiceTestsMetaQuery();
  const [airtime, { isLoading: aBusy }] = usePostServiceTestAirtimeMutation();
  const [bundles, { isLoading: bBusy }] = usePostServiceTestBundlesMutation();
  const [dataTop, { isLoading: dBusy }] = usePostServiceTestDataTopupMutation();

  const networks = ((meta as { networks?: NetworkRow[] } | undefined)?.networks ?? []) as NetworkRow[];
  const [operatorId, setOperatorId] = useState("");
  const [countryIso, setCountryIso] = useState(
    String((meta as { country_iso?: string } | undefined)?.country_iso ?? "GH"),
  );
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("GHS");
  const [bundleCode, setBundleCode] = useState("");
  const [out, setOut] = useState<unknown>(null);

  const [catalogOpen, setCatalogOpen] = useState(false);
  const { data: catalogData, isFetching: catalogBusy } = useGetReloadlyOperatorsQuery(
    { countryIso },
    { skip: !catalogOpen },
  );

  const [airtimeNetworkSlug, setAirtimeNetworkSlug] = useState<string>(
    networks[0]?.slug ?? "mtn",
  );
  const [dataNetworkSlug, setDataNetworkSlug] = useState<string>(
    networks[0]?.slug ?? "mtn",
  );
  const [bundleFilter, setBundleFilter] = useState("");
  const [bundleList, setBundleList] = useState<unknown[]>([]);

  const selectedAirtime = networks.find((n) => n.slug === airtimeNetworkSlug);
  const selectedData = networks.find((n) => n.slug === dataNetworkSlug);

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
      const raw = (res as BundlesResponse | undefined)?.data;
      setBundleList(normalizeBundles(raw));
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
        <h1 className="admin-page-title">Service tests</h1>
        <p className="admin-page-sub">
          Sanctioned checks against the live top-up integration. Each run uses a
          fresh idempotency key.
        </p>
      </header>

      <Card className="rounded-none">
        <CardHeader className="flex flex-row items-center justify-between border-b py-3">
          <CardTitle className="admin-card-title">Live operator catalog</CardTitle>
          <Button
            type="button"
            variant="ghost"
            disabled={catalogBusy}
            onClick={() => {
              setCatalogOpen(true);
            }}
          >
            {catalogBusy ? "Loading…" : "Load live catalog"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground text-xs">
            {countryIso} operators from the provider (reference for mappings).
          </p>
          {catalogOpen ? (
            <pre className="bg-muted max-h-56 overflow-auto rounded-md p-3 font-mono text-[10px] whitespace-pre-wrap wrap-break-word">
              {JSON.stringify(catalogData ?? { success: false, message: "No data" }, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">Shared fields</CardTitle>
        </CardHeader>
        <CardContent className="grid max-w-xl gap-3 md:grid-cols-2">
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

      <Card className="rounded-none">
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">Airtime test</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-xl gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              void runAirtime(e);
            }}
          >
            <div className="space-y-2 md:col-span-2">
              <Label>Network</Label>
              <select
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                value={airtimeNetworkSlug}
                onChange={(e) => {
                  const next = e.target.value;
                  setAirtimeNetworkSlug(next);
                  const row = networks.find((n) => n.slug === next);
                  const nextId = row?.operator_id;
                  if (typeof nextId === "number" && Number.isFinite(nextId)) {
                    setOperatorId(String(nextId));
                  }
                }}
              >
                {networks.map((n) => (
                  <option key={n.slug} value={n.slug}>
                    {n.label} ({n.slug})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-op">Airtime operator ID</Label>
              <Input
                id="st-op"
                value={operatorId}
                onChange={(e) => {
                  setOperatorId(e.target.value);
                }}
                required
              />
              <p className="text-muted-foreground text-[11px]">
                Suggested:{" "}
                <span className="font-mono text-foreground">
                  {String(selectedAirtime?.operator_id ?? "—")}
                </span>
              </p>
            </div>
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
              {aBusy ? "Running…" : "Run airtime test"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">Data bundles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label>Network</Label>
              <select
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={dataNetworkSlug}
                onChange={(e) => {
                  const next = e.target.value;
                  setDataNetworkSlug(next);
                  const row = networks.find((n) => n.slug === next);
                  const nextId = row?.data_operator_id ?? row?.operator_id;
                  if (typeof nextId === "number" && Number.isFinite(nextId)) {
                    setOperatorId(String(nextId));
                  }
                }}
              >
                {networks.map((n) => (
                  <option key={n.slug} value={n.slug}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Data operator ID</Label>
              <Input
                value={operatorId}
                onChange={(e) => {
                  setOperatorId(e.target.value);
                }}
                className="w-[160px]"
              />
              <p className="text-muted-foreground text-[11px]">
                Suggested:{" "}
                <span className="font-mono text-foreground">
                  {String(selectedData?.data_operator_id ?? "—")}
                </span>
              </p>
            </div>
            <Button
              type="button"
              disabled={bBusy}
              onClick={(e) => {
                void runBundles(e as unknown as React.FormEvent);
              }}
            >
              {bBusy ? "Loading…" : "Load bundles"}
            </Button>
          </div>

          <div className="mt-3 max-w-sm space-y-2">
            <Label>Filter (contains)</Label>
            <Input
              value={bundleFilter}
              onChange={(e) => {
                setBundleFilter(e.target.value);
              }}
              placeholder="MB, GB, social…"
            />
          </div>

          {bundleList.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-foreground">
                  <tr className="text-left">
                    <th className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Code
                    </th>
                    <th className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Name
                    </th>
                    <th className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Price (local)
                    </th>
                    <th className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Price (fixed)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bundleList
                    .filter((b) => {
                      const r = b as Record<string, unknown>;
                      const q = bundleFilter.trim().toLowerCase();
                      if (!q) return true;
                      const name = String(r.name ?? r.title ?? "").toLowerCase();
                      const code = String(r.productCode ?? r.bundleProductCode ?? r.code ?? "").toLowerCase();
                      return name.includes(q) || code.includes(q);
                    })
                    .map((b, i) => {
                      const r = b as Record<string, unknown>;
                      const code = String(r.productCode ?? r.bundleProductCode ?? r.code ?? "—");
                      const name = String(r.name ?? r.title ?? "—");
                      const local = String(r.localAmount ?? r.price ?? r.amount ?? "—");
                      const fixed = String(r.suggestedAmount ?? r.fixedAmount ?? "—");
                      return (
                        <tr key={`${code}-${i}`} className="border-b hover:bg-muted/30">
                          <td className="px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground">{code}</td>
                          <td className="px-3.5 py-2.5">{name}</td>
                          <td className="px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground">{local}</td>
                          <td className="px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground">{fixed}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">Data bundle test purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-xl gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              void runData(e);
            }}
          >
            <div className="space-y-2 md:col-span-2">
              <Label>Data operator ID</Label>
              <Input
                value={operatorId}
                onChange={(e) => {
                  setOperatorId(e.target.value);
                }}
                required
              />
            </div>
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
              {dBusy ? "Running…" : "Run data test purchase"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {out !== null ? (
        <Card className="rounded-none">
          <CardHeader className="border-b py-3">
            <CardTitle className="admin-card-title">Last response</CardTitle>
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
