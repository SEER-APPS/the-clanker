"use client";

import { useGetDataCatalogueQuery, usePostDataCatalogueFetchMutation, usePostDataCatalogueFindMutation } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function DataCataloguePage(): React.ReactElement {
  const { data: meta } = useGetDataCatalogueQuery();
  const [fetchCat, { isLoading: fetching }] = usePostDataCatalogueFetchMutation();
  const [findCat, { isLoading: finding }] = usePostDataCatalogueFindMutation();
  const [sampleMtn, setSampleMtn] = useState("");
  const [sampleTelecel, setSampleTelecel] = useState("");
  const [sampleAt, setSampleAt] = useState("");
  const [countryIso, setCountryIso] = useState("GH");
  const [query, setQuery] = useState("");
  const [network, setNetwork] = useState("all");
  const [provider, setProvider] = useState("all");
  const [fetchOut, setFetchOut] = useState<unknown>(null);
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
      setFetchOut(res);
      toast.success("Fetch completed.");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Failed.")
          : "Failed.";
      toast.error(msg);
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
      setFindOut(res);
      toast.success("Lookup completed.");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Failed.")
          : "Failed.";
      toast.error(msg);
    }
  }

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Data catalogue</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Combine Hubtel and Reloadly catalogues for package matching. API ready:{" "}
          {meta?.ready === true ? "yes" : "unknown"}.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sample MSISDN (per network)</CardTitle>
        </CardHeader>
        <CardContent className="grid max-w-xl gap-3 md:grid-cols-2">
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
          <div className="space-y-2">
            <Label htmlFor="dc-iso">Country ISO</Label>
            <Input
              id="dc-iso"
              value={countryIso}
              onChange={(e) => {
                setCountryIso(e.target.value);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fetch combined catalogue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            onSubmit={(e) => {
              void onFetch(e);
            }}
          >
            <Button
              type="submit"
              disabled={fetching}
            >
              {fetching ? "Fetching…" : "Run fetch"}
            </Button>
          </form>
          {fetchOut !== null ? (
            <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 font-mono text-xs">
              {JSON.stringify(fetchOut, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Find package by price or size</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            className="grid max-w-xl gap-3"
            onSubmit={(e) => {
              void onFind(e);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="dc-query">Query</Label>
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
            <Button
              type="submit"
              disabled={finding}
            >
              {finding ? "Searching…" : "Find"}
            </Button>
          </form>
          {findOut !== null ? (
            <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 font-mono text-xs">
              {JSON.stringify(findOut, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>
    </article>
  );
}
