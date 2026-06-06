"use client";

import { useGetDataCatalogueQuery, usePostDataCatalogueFetchMutation, usePostDataCatalogueFindMutation } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { flattenApiData, formatAdminMutationError } from "@/lib/admin-api-envelope";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CataloguePackage = {
  provider: "hubtel" | "reloadly";
  network: "mtn" | "telecel" | "at";
  display: string;
  data_mb: number | null;
  price_ghs: number | null;
  bundle_key: string;
};

export default function DataCataloguePage(): React.ReactElement {
  const { data: meta } = useGetDataCatalogueQuery();
  const [fetchCat, { isLoading: fetching }] = usePostDataCatalogueFetchMutation();
  const [findCat, { isLoading: finding }] = usePostDataCatalogueFindMutation();
  const [sampleMtn, setSampleMtn] = useState("233241234567");
  const [sampleTelecel, setSampleTelecel] = useState("233201234567");
  const [sampleAt, setSampleAt] = useState("233261234567");
  const [countryIso, setCountryIso] = useState("GH");
  const [query, setQuery] = useState("");
  const [network, setNetwork] = useState("all");
  const [provider, setProvider] = useState("all");
  const [packages, setPackages] = useState<CataloguePackage[]>([]);
  const [providers, setProviders] = useState<Record<string, unknown> | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [findOut, setFindOut] = useState<unknown>(null);

  async function onFetch(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    try {
      const res = await fetchCat({
        sample_mtn: sampleMtn || undefined,
        sample_telecel: sampleTelecel || undefined,
        sample_at: sampleAt || undefined,
        country_iso: countryIso || undefined,
      }).unwrap();
      const payload = flattenApiData(res);
      const nextPackages = safeArray<CataloguePackage>(payload?.packages);
      setPackages(nextPackages);
      setProviders((payload?.providers as Record<string, unknown> | undefined) ?? null);
      toast.success(`Loaded ${nextPackages.length} packages.`);
    } catch (err: unknown) {
      toast.error(formatAdminMutationError(err));
    }
  }

  async function onFind(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    try {
      const res = await findCat({
        query,
        sample_mtn: sampleMtn || undefined,
        sample_telecel: sampleTelecel || undefined,
        sample_at: sampleAt || undefined,
        network,
        provider,
      }).unwrap();
      const payload = flattenApiData(res);
      setFindOut(payload ?? res);
      toast.success("Lookup completed.");
    } catch (err: unknown) {
      toast.error(formatAdminMutationError(err));
    }
  }

  return (
    <article className="space-y-6">
      <AdminPageHeader
        title="Data Bundle Catalogue"
        subtitle="Combined view of Hubtel + Reloadly data packages · Price & size matching"
      />

      <Card>
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">Step 1 — Load Catalogue</CardTitle>
          <p className="text-muted-foreground text-xs">
            Hubtel needs a sample MSISDN per network (any active number works).
          </p>
        </CardHeader>
        <CardContent className="space-y-3 py-4">
          <form
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
            onSubmit={(e) => {
              void onFetch(e);
            }}
          >
          <div className="space-y-2">
            <Label htmlFor="dc-mtn">MTN sample</Label>
            <Input
              id="dc-mtn"
              value={sampleMtn}
              onChange={(e) => {
                setSampleMtn(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dc-tc">Telecel sample</Label>
            <Input
              id="dc-tc"
              value={sampleTelecel}
              onChange={(e) => {
                setSampleTelecel(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dc-at">AT sample</Label>
            <Input
              id="dc-at"
              value={sampleAt}
              onChange={(e) => {
                setSampleAt(e.target.value);
              }}
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="w-full space-y-2">
              <Label htmlFor="dc-iso">Country ISO</Label>
              <Input
                id="dc-iso"
                value={countryIso}
                onChange={(e) => {
                  setCountryIso(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <Button type="submit" disabled={fetching} aria-busy={fetching}>
              {fetching ? (
                <>
                  <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden="true" />
                  Fetching catalogue…
                </>
              ) : packages.length ? (
                "Reload Catalogue"
              ) : (
                "Load Combined Catalogue"
              )}
            </Button>
            <span className="text-muted-foreground ml-3 text-sm">
              {meta?.note ? String(meta.note) : ""}
            </span>
          </div>
        </form>

          {providers ? (
            <section className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(providers).map(([key, info]) => {
                const fetched = Boolean((info as Record<string, unknown>)?.fetched);
                const count = Number((info as Record<string, unknown>)?.count ?? 0);
                const err = String((info as Record<string, unknown>)?.error ?? "");
                return (
                  <div
                    key={key}
                    className={[
                      "rounded-md border px-3 py-2 text-sm",
                      fetched ? "border-emerald-600/30 bg-emerald-600/10" : "border-amber-500/40 bg-amber-500/10",
                    ].join(" ")}
                  >
                    <div className="font-semibold">{key}</div>
                    <div className="text-muted-foreground text-xs">
                      {fetched ? `✓ ${count} packages` : `⚠ ${err || "Not fetched"}`}
                    </div>
                  </div>
                );
              })}
            </section>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">Step 2 — Find Package</CardTitle>
          <p className="text-muted-foreground text-xs">
            Enter a price (e.g. 6) or a data size (e.g. 200MB, 1GB).
          </p>
        </CardHeader>
        <CardContent className="space-y-3 py-4">
          <form
            className="grid gap-3 md:grid-cols-3"
            onSubmit={(e) => {
              void onFind(e);
            }}
          >
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="dc-query">Price (GHS) or data size (MB/GB)</Label>
              <Input
                id="dc-query"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                placeholder='e.g. "6" or "1GB"'
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dc-net">Network filter</Label>
              <select
                id="dc-net"
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={network}
                onChange={(e) => {
                  setNetwork(e.target.value);
                }}
              >
                <option value="all">all</option>
                <option value="mtn">mtn</option>
                <option value="telecel">telecel</option>
                <option value="at">at</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dc-prov">Provider filter</Label>
              <select
                id="dc-prov"
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                }}
              >
                <option value="all">all</option>
                <option value="hubtel">hubtel</option>
                <option value="reloadly">reloadly</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={finding} aria-busy={finding} className="w-full">
                {finding ? (
                  <>
                    <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden="true" />
                    Searching…
                  </>
                ) : (
                  "Find Match"
                )}
              </Button>
            </div>
          </form>
          {findOut ? (
            <MatchResult payload={findOut} />
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader className="flex flex-row items-center justify-between border-b py-3">
          <CardTitle className="admin-card-title">All Packages</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
              }}
              placeholder="Filter…"
              className="h-9 w-40"
            />
            <span className="text-muted-foreground text-xs">
              {packages.length ? `${filterPackages(packages, tableSearch).length} of ${packages.length}` : "—"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[520px] overflow-auto">
            <Table>
              <TableHeader className="admin-table-heavy-divider sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="admin-table-head">Provider</TableHead>
                  <TableHead className="admin-table-head">Network</TableHead>
                  <TableHead className="admin-table-head">Label</TableHead>
                  <TableHead className="admin-table-head">Data size</TableHead>
                  <TableHead className="admin-table-head">Price (GHS)</TableHead>
                  <TableHead className="admin-table-head">Bundle key</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterPackages(packages, tableSearch).length ? (
                  filterPackages(packages, tableSearch).map((p) => (
                    <TableRow key={p.bundle_key} className="hover:bg-muted/30">
                      <TableCell>
                        <Badge variant="gray">{p.provider}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="gray">{p.network.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{p.display}</TableCell>
                      <TableCell className="text-sm">{formatMb(p.data_mb)}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {p.price_ghs != null ? String(p.price_ghs) : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {p.bundle_key}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                      {packages.length ? "No results for this filter." : "Load the catalogue to view packages."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}

function safeArray<T>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function filterPackages(all: CataloguePackage[], q: string): CataloguePackage[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return all;
  return all.filter((p) => {
    return (
      p.display.toLowerCase().includes(needle) ||
      p.network.toLowerCase().includes(needle) ||
      p.provider.toLowerCase().includes(needle) ||
      p.bundle_key.toLowerCase().includes(needle)
    );
  });
}

function formatMb(mb: number | null): string {
  if (mb == null) return "—";
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb} MB`;
}

function MatchResult({ payload }: { payload: unknown }): React.ReactElement {
  const root = payload as Record<string, unknown>;
  const match =
    (root.match as Record<string, unknown> | undefined) ??
    ((root.data as Record<string, unknown> | undefined)?.match as Record<string, unknown> | undefined);

  if (!match) {
    return (
      <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 font-mono text-xs">
        {JSON.stringify(payload, null, 2)}
      </pre>
    );
  }

  const strategy = String(match.strategy ?? "");
  const exact = Boolean(match.exact);
  const parsedValue = match.parsed_value as number | undefined;
  const input = String(match.input ?? "");
  const allExact = safeArray<Record<string, unknown>>(match.all_exact);
  const lower = (match.lower as Record<string, unknown> | undefined) ?? null;
  const higher = (match.higher as Record<string, unknown> | undefined) ?? null;

  return (
    <section className="space-y-3">
      <div className="text-muted-foreground text-sm">
        Strategy:{" "}
        <span className="text-foreground font-semibold">
          {strategy === "price"
            ? `GHS ${String(parsedValue ?? "")} (price match)`
            : `${input} ≈ ${Number.isFinite(Number(parsedValue)) ? Number(parsedValue).toFixed(2) : "—"} MB (data size match)`}
        </span>
      </div>

      {exact ? (
        <div className="space-y-2">
          <div className="text-emerald-700 text-sm font-semibold">
            Exact match{allExact.length > 1 ? ` (${allExact.length} packages)` : ""}:
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {allExact.map((p, i) => (
              <PackageCard key={`${String(p.bundle_key ?? "")}-${i}`} pkg={p} tone="ok" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-muted-foreground text-xs">↓ Closest lower</div>
            {lower ? <PackageCard pkg={lower} tone="low" /> : <EmptyNote text="No lower package available." />}
          </div>
          <div className="space-y-2">
            <div className="text-muted-foreground text-xs">↑ Closest higher</div>
            {higher ? <PackageCard pkg={higher} tone="high" /> : <EmptyNote text="No higher package available." />}
          </div>
        </div>
      )}

      <Separator />
      <details>
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          Raw response
        </summary>
        <pre className="bg-muted mt-2 max-h-80 overflow-auto rounded-md p-3 font-mono text-xs">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
    </section>
  );
}

function EmptyNote({ text }: { text: string }): React.ReactElement {
  return <div className="bg-muted rounded-md p-3 text-sm text-muted-foreground">{text}</div>;
}

function PackageCard({
  pkg,
  tone,
}: {
  pkg: Record<string, unknown>;
  tone: "ok" | "low" | "high";
}): React.ReactElement {
  const provider = String(pkg.provider ?? "—");
  const network = String(pkg.network ?? "—");
  const display = String(pkg.display ?? "—");
  const dataMb = pkg.data_mb == null ? null : Number(pkg.data_mb);
  const price = pkg.price_ghs == null ? null : Number(pkg.price_ghs);
  const bundleKey = String(pkg.bundle_key ?? "—");

  const toneClass =
    tone === "ok"
      ? "border-emerald-600/30 bg-emerald-600/10"
      : tone === "low"
        ? "border-blue-600/20 bg-blue-600/10"
        : "border-amber-600/20 bg-amber-600/10";

  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <div className="flex flex-wrap gap-2">
        <Badge variant="gray">{provider}</Badge>
        <Badge variant="gray">{network.toUpperCase()}</Badge>
      </div>
      <div className="mt-2 text-sm font-semibold">{display}</div>
      <div className="text-muted-foreground mt-1 text-xs">
        <span className="font-semibold text-foreground">Data:</span> {formatMb(Number.isFinite(dataMb ?? NaN) ? (dataMb as number) : null)}{" "}
        <span className="mx-2">·</span>
        <span className="font-semibold text-foreground">Price:</span> {price != null && Number.isFinite(price) ? `GHS ${price}` : "—"}
      </div>
      <div className="text-muted-foreground mt-1 font-mono text-[11px]">key: {bundleKey}</div>
    </div>
  );
}
