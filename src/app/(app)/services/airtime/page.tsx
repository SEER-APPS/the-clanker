"use client";

import { useState } from "react";
import {
  useGetReloadlyAirtimeQuery,
  useGetReloadlyOperatorsQuery,
  useSaveOperatorMappingsMutation,
} from "@/store/admin-api";
import { HubtelServiceTransactionsCard } from "@/components/hubtel/hubtel-service-transactions-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export default function AirtimePage(): React.ReactElement {
  const { data: reloadlyMeta } = useGetReloadlyAirtimeQuery({ page: 1 });
  const countryIso = String(reloadlyMeta?.country_iso ?? "GH");
  const { data: opData, refetch: refetchOps } = useGetReloadlyOperatorsQuery({ countryIso });
  const [saveMappings, { isLoading: saving }] = useSaveOperatorMappingsMutation();
  const [operatorsOpen, setOperatorsOpen] = useState(false);

  const canEdit = Boolean(reloadlyMeta?.can_edit_mappings);
  const storedMappings = (reloadlyMeta?.stored_mappings ?? []) as Array<Record<string, unknown>>;

  const [catalog, setCatalog] = useState({
    airteltigo: "",
    mtn_airtime: "",
    mtn_data: "",
    telecel_airtime: "",
    telecel_data: "",
  });

  function resolveStoredMapping(slug: string): { operatorId?: number; operatorIdData?: number; label?: string } {
    const m = storedMappings.find((row) => String(row.telco_slug ?? "") === slug);
    return {
      operatorId: typeof m?.operator_id === "number" ? m.operator_id : Number(m?.operator_id ?? NaN),
      operatorIdData: typeof m?.operator_id_data === "number" ? m.operator_id_data : Number(m?.operator_id_data ?? NaN),
      label: m?.label ? String(m.label) : undefined,
    };
  }

  async function onSaveCatalog(): Promise<void> {
    try {
      const payload: Record<string, number> = {};
      for (const [k, v] of Object.entries(catalog)) {
        const n = Number(v);
        if (!v.trim()) continue;
        if (!Number.isFinite(n) || n < 1) {
          toast.error(`Invalid operator ID for ${k}.`);
          return;
        }
        payload[k] = n;
      }
      if (Object.keys(payload).length < 1) {
        toast.error("Enter at least one operator ID.");
        return;
      }
      await saveMappings({
        country_iso: countryIso,
        catalog: payload,
      }).unwrap();
      toast.success("Mappings saved.");
      void refetchOps();
      setOperatorsOpen(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Save failed.")
          : "Save failed.";
      toast.error(msg);
    }
  }

  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <AdminPageHeader
          title="Airtime"
          subtitle={`Hubtel airtime transactions · operator mappings · ${countryIso}`}
        />
        <Dialog
          open={operatorsOpen}
          onOpenChange={(next) => {
            setOperatorsOpen(next);
            if (next) {
              void refetchOps();
              const at = resolveStoredMapping("airteltigo");
              const mtn = resolveStoredMapping("mtn");
              const tel = resolveStoredMapping("telecel");
              setCatalog({
                airteltigo: String(at.operatorId && Number.isFinite(at.operatorId) ? at.operatorId : 153),
                mtn_airtime: String(mtn.operatorId && Number.isFinite(mtn.operatorId) ? mtn.operatorId : 150),
                mtn_data: String(mtn.operatorIdData && Number.isFinite(mtn.operatorIdData) ? mtn.operatorIdData : 643),
                telecel_airtime: String(tel.operatorId && Number.isFinite(tel.operatorId) ? tel.operatorId : 155),
                telecel_data: String(tel.operatorIdData && Number.isFinite(tel.operatorIdData) ? tel.operatorIdData : 770),
              });
            }
          }}
        >
          <DialogTrigger
            render={
              <Button type="button">
                View providers &amp; operators
              </Button>
            }
          />
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Provider catalog (live)</DialogTitle>
            </DialogHeader>

            <p className="text-muted-foreground text-sm">
              Country {String(opData?.countryIso ?? countryIso)} — operator id and name (use to verify mapping values).
            </p>

            <pre className="bg-muted max-h-72 overflow-auto rounded-md p-3 font-mono text-xs whitespace-pre-wrap wrap-break-word">
              {formatOperatorsList(opData?.operators)}
            </pre>

            {canEdit ? (
              <section className="space-y-3">
                <Separator />
                <p className="text-muted-foreground text-sm">
                  Match Reloadly Ghana operators (one row each). Saved as three networks:{" "}
                  <span className="font-mono text-foreground">airteltigo</span>,{" "}
                  <span className="font-mono text-foreground">mtn</span> (airtime + data),{" "}
                  <span className="font-mono text-foreground">telecel</span> (airtime + data).
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  <CatalogField
                    label="Airtel-Tigo Ghana"
                    value={catalog.airteltigo}
                    onChange={(v) => setCatalog((p) => ({ ...p, airteltigo: v }))}
                  />
                  <CatalogField
                    label="MTN Ghana (airtime)"
                    value={catalog.mtn_airtime}
                    onChange={(v) => setCatalog((p) => ({ ...p, mtn_airtime: v }))}
                  />
                  <CatalogField
                    label="MTN Ghana Data"
                    value={catalog.mtn_data}
                    onChange={(v) => setCatalog((p) => ({ ...p, mtn_data: v }))}
                  />
                  <CatalogField
                    label="Telecel Ghana (airtime)"
                    value={catalog.telecel_airtime}
                    onChange={(v) => setCatalog((p) => ({ ...p, telecel_airtime: v }))}
                  />
                  <CatalogField
                    label="Telecel Ghana Data"
                    value={catalog.telecel_data}
                    onChange={(v) => setCatalog((p) => ({ ...p, telecel_data: v }))}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={saving} onClick={() => void onSaveCatalog()}>
                    {saving ? "Saving…" : "Save mappings"}
                  </Button>
                  <DialogClose render={<Button type="button" variant="ghost" disabled={saving} />}>
                    Close
                  </DialogClose>
                </div>
              </section>
            ) : (
              <p className="text-muted-foreground text-sm">
                Super admins can save operator mappings from this modal.
              </p>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {storedMappings.length ? (
        <Card className="rounded-none">
          <CardHeader className="border-b py-3">
            <CardTitle className="admin-card-title">Operator mappings ({countryIso})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="admin-table-heavy-divider">
                  <TableRow>
                    <TableHead className="admin-table-head">Slug</TableHead>
                    <TableHead className="admin-table-head">Airtime ID</TableHead>
                    <TableHead className="admin-table-head">Data / bundles ID</TableHead>
                    <TableHead className="admin-table-head">Label</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storedMappings.map((m) => (
                    <TableRow key={String(m.telco_slug ?? "")}>
                      <TableCell className="font-mono text-xs">{String(m.telco_slug ?? "—")}</TableCell>
                      <TableCell className="font-mono text-xs">{String(m.operator_id ?? "—")}</TableCell>
                      <TableCell className="font-mono text-xs">{String(m.operator_id_data ?? "—")}</TableCell>
                      <TableCell>{String(m.label ?? "—")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <HubtelServiceTransactionsCard
        title="Airtime transactions"
        productGroup="airtime"
        showStatusFilter
      />
    </article>
  );
}

function CatalogField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}): React.ReactElement {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        inputMode="numeric"
      />
    </div>
  );
}

function formatOperatorsList(raw: unknown): string {
  const arr =
    Array.isArray(raw) ? raw : raw && typeof raw === "object"
      ? (Array.isArray((raw as Record<string, unknown>).content)
          ? ((raw as Record<string, unknown>).content as unknown[])
          : Array.isArray((raw as Record<string, unknown>).data)
            ? ((raw as Record<string, unknown>).data as unknown[])
            : [])
      : [];

  if (!arr.length) {
    return JSON.stringify(raw ?? {}, null, 2);
  }

  return arr
    .map((o) => {
      const r = o as Record<string, unknown>;
      const id = r.operatorId ?? r.id ?? "?";
      const name = r.name ?? r.title ?? "—";
      return `${String(id)}\t${String(name)}`;
    })
    .join("\n");
}
