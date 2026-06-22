"use client";

import { useMemo, useState } from "react";
import {
  useCreateHubnetSkuMutation,
  useDeleteHubnetSkuMutation,
  useGetHubnetOffersQuery,
  useGetHubnetSkusQuery,
  useGetHubnetSummaryQuery,
  useGetHubnetTransactionsQuery,
  useHubnetStatusCheckMutation,
  useHubnetTestDeliverMutation,
  useUpdateHubnetSettingsMutation,
  useUpdateHubnetSkuMutation,
} from "@/store/admin-api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatAdminMutationError } from "@/lib/admin-api-envelope";
import { Loader2 } from "lucide-react";

type HubnetSku = {
  id: number;
  code: string;
  network: string;
  volume_mb?: number;
  volumeMb?: number;
  label: string;
  wholesale_ghs?: number;
  wholesaleGhs?: number;
  retail_ghs?: number;
  retailGhs?: number;
  margin_ghs?: number;
  marginGhs?: number;
  active: boolean;
  sort_order?: number;
  sortOrder?: number;
};

function readSkuVolume(sku: HubnetSku): number {
  return sku.volumeMb ?? sku.volume_mb ?? 0;
}

function readSkuWholesale(sku: HubnetSku): number {
  return sku.wholesaleGhs ?? sku.wholesale_ghs ?? 0;
}

function readSkuRetail(sku: HubnetSku): number {
  return sku.retailGhs ?? sku.retail_ghs ?? 0;
}

function readSkuMargin(sku: HubnetSku): number {
  return sku.marginGhs ?? sku.margin_ghs ?? 0;
}

export default function HubnetAdminPage(): React.ReactElement {
  const { data: summary, isLoading, refetch } = useGetHubnetSummaryQuery();
  const { data: skusData } = useGetHubnetSkusQuery();
  const { data: txData } = useGetHubnetTransactionsQuery({ page: 1, per_page: 10, is_test: "1" });
  const [updateSettings, { isLoading: savingSettings }] = useUpdateHubnetSettingsMutation();
  const [createSku, { isLoading: creatingSku }] = useCreateHubnetSkuMutation();
  const [updateSku] = useUpdateHubnetSkuMutation();
  const [deleteSku] = useDeleteHubnetSkuMutation();
  const [testDeliver, { isLoading: delivering }] = useHubnetTestDeliverMutation();
  const [statusCheck, { isLoading: checkingStatus }] = useHubnetStatusCheckMutation();

  const settings = (summary?.settings ?? {}) as Record<string, unknown>;

  const [markupPercent, setMarkupPercent] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [fundingNotes, setFundingNotes] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (!initialized && summary?.settings) {
    setMarkupPercent(String(settings.markupPercent ?? "10"));
    setEnabled(Boolean(settings.enabled));
    setFundingNotes(String(settings.fundingNotes ?? ""));
    setInitialized(true);
  }

  const skus = useMemo(() => {
    return (skusData?.skus as HubnetSku[] | undefined) ?? [];
  }, [skusData]);

  const [skuCode, setSkuCode] = useState("");
  const [skuNetwork, setSkuNetwork] = useState("mtn");
  const [skuVolume, setSkuVolume] = useState("2000");
  const [skuLabel, setSkuLabel] = useState("MTN 2GB");
  const [skuWholesale, setSkuWholesale] = useState("20");
  const [testPhone, setTestPhone] = useState("");
  const [testSkuCode, setTestSkuCode] = useState("");
  const [lastReference, setLastReference] = useState("");

  const transactions =
    (txData?.transactions as Array<Record<string, unknown>> | undefined) ?? [];

  async function handleSaveSettings(): Promise<void> {
    try {
      await updateSettings({
        markup_percent: Number.parseFloat(markupPercent) || 0,
        enabled,
        funding_notes: fundingNotes.trim() || null,
      }).unwrap();
      toast.success("Hubnet settings saved.");
      void refetch();
    } catch (error) {
      toast.error(formatAdminMutationError(error));
    }
  }

  async function handleCreateSku(): Promise<void> {
    try {
      await createSku({
        code: skuCode.trim(),
        network: skuNetwork,
        volume_mb: Number.parseInt(skuVolume, 10),
        label: skuLabel.trim(),
        wholesale_ghs: Number.parseFloat(skuWholesale),
      }).unwrap();
      toast.success("SKU created.");
      setSkuCode("");
    } catch (error) {
      toast.error(formatAdminMutationError(error));
    }
  }

  async function handleToggleSku(sku: HubnetSku): Promise<void> {
    try {
      await updateSku({ id: sku.id, body: { active: !sku.active } }).unwrap();
      toast.success(sku.active ? "SKU disabled." : "SKU enabled.");
    } catch (error) {
      toast.error(formatAdminMutationError(error));
    }
  }

  async function handleDeleteSku(id: number): Promise<void> {
    try {
      await deleteSku(id).unwrap();
      toast.success("SKU deleted.");
    } catch (error) {
      toast.error(formatAdminMutationError(error));
    }
  }

  async function handleTestDeliver(): Promise<void> {
    try {
      const result = await testDeliver({
        phone: testPhone.trim(),
        sku_code: testSkuCode.trim() || undefined,
      }).unwrap();
      const tx = (result as { transaction?: { reference?: string } }).transaction;
      const reference = tx?.reference ?? "";
      if (reference) {
        setLastReference(reference);
      }
      toast.success("Hubnet delivery initiated.");
    } catch (error) {
      toast.error(formatAdminMutationError(error));
    }
  }

  async function handleStatusCheck(): Promise<void> {
    if (!lastReference.trim()) {
      toast.error("Run a test delivery first or paste a reference.");
      return;
    }
    try {
      await statusCheck({ reference: lastReference.trim() }).unwrap();
      toast.success("Status refreshed.");
    } catch (error) {
      toast.error(formatAdminMutationError(error));
    }
  }

  return (
    <article className="space-y-6">
      <AdminPageHeader
        title="Hubnet Data"
        subtitle="Wholesale data delivery · SKU catalog · markup pricing · test flow"
      />

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading Hubnet summary…</p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-none p-3">
          <p className="text-2xl font-semibold">{summary?.configured ? "Yes" : "No"}</p>
          <p className="text-muted-foreground text-xs">API configured</p>
        </Card>
        <Card className="rounded-none p-3">
          <p className="text-2xl font-semibold">
            {summary?.balance != null ? `GHS ${summary.balance}` : "—"}
          </p>
          <p className="text-muted-foreground text-xs">Hubnet wallet</p>
        </Card>
        <Card className="rounded-none p-3">
          <p className="text-2xl font-semibold">{String(summary?.active_sku_count ?? 0)}</p>
          <p className="text-muted-foreground text-xs">Active SKUs</p>
        </Card>
        <Card className="rounded-none p-3">
          <p className="text-2xl font-semibold">{enabled ? "Live" : "Off"}</p>
          <p className="text-muted-foreground text-xs">Offers in app API</p>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-base">Pricing settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="markup">Markup percent</Label>
              <Input
                id="markup"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(e.target.value)}
                placeholder="10"
              />
              <p className="text-muted-foreground text-xs">
                Retail = wholesale × (1 + markup%). Example: GHS 20 wholesale + 10% → GHS 22 retail.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="enabled">Expose offers in APIs</Label>
              <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Funding notes (internal)</Label>
              <Textarea
                id="notes"
                value={fundingNotes}
                onChange={(e) => setFundingNotes(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={() => void handleSaveSettings()} disabled={savingSettings}>
              {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save settings
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-base">Add SKU</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Code</Label>
                <Input value={skuCode} onChange={(e) => setSkuCode(e.target.value)} placeholder="mtn-2gb" />
              </div>
              <div className="space-y-1">
                <Label>Network</Label>
                <select
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={skuNetwork}
                  onChange={(e) => setSkuNetwork(e.target.value)}
                >
                  <option value="mtn">MTN</option>
                  <option value="at">AirtelTigo</option>
                  <option value="big-time">big-time</option>
                  <option value="telecel">Telecel</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Volume (MB)</Label>
                <Input value={skuVolume} onChange={(e) => setSkuVolume(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Wholesale GHS</Label>
                <Input value={skuWholesale} onChange={(e) => setSkuWholesale(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Label</Label>
              <Input value={skuLabel} onChange={(e) => setSkuLabel(e.target.value)} />
            </div>
            <Button onClick={() => void handleCreateSku()} disabled={creatingSku}>
              {creatingSku ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create SKU
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-base">Catalog & computed retail</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>MB</TableHead>
                <TableHead>Wholesale</TableHead>
                <TableHead>Retail</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {skus.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground text-sm">
                    No SKUs yet. Add wholesale costs from your Hubnet console rate card.
                  </TableCell>
                </TableRow>
              ) : (
                skus.map((sku) => (
                  <TableRow key={sku.code}>
                    <TableCell>{sku.label}</TableCell>
                    <TableCell>{sku.network}</TableCell>
                    <TableCell>{readSkuVolume(sku)}</TableCell>
                    <TableCell>GHS {readSkuWholesale(sku).toFixed(2)}</TableCell>
                    <TableCell>GHS {readSkuRetail(sku).toFixed(2)}</TableCell>
                    <TableCell>GHS {readSkuMargin(sku).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={sku.active ? "white" : "gray"}>
                        {sku.active ? "Active" : "Off"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => void handleToggleSku(sku)}>
                        {sku.active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDeleteSku(sku.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-base">Test delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Requires Hubnet wallet balance. Uses wholesale cost from SKU; no Hubtel payment in this
              test.
            </p>
            <div className="space-y-1">
              <Label>Recipient phone</Label>
              <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="0241234567" />
            </div>
            <div className="space-y-1">
              <Label>SKU code</Label>
              <Input
                value={testSkuCode}
                onChange={(e) => setTestSkuCode(e.target.value)}
                placeholder="mtn-2gb"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void handleTestDeliver()} disabled={delivering}>
                {delivering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send test bundle
              </Button>
              <Button variant="outline" onClick={() => void handleStatusCheck()} disabled={checkingStatus}>
                {checkingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Check status
              </Button>
            </div>
            {lastReference ? (
              <p className="text-muted-foreground text-xs">Last reference: {lastReference}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-base">Recent test transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-sm">
                      No test deliveries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((row) => (
                    <TableRow key={String(row.reference)}>
                      <TableCell className="font-mono text-xs">{String(row.reference)}</TableCell>
                      <TableCell>{String(row.recipient_phone)}</TableCell>
                      <TableCell>{String(row.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
