"use client";

import { useState } from "react";
import {
  useGetReloadlyAirtimeQuery,
  useGetReloadlyOperatorsQuery,
  useSaveOperatorMappingsMutation,
} from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
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
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetReloadlyAirtimeQuery({ page });
  const countryIso = String(data?.country_iso ?? "GH");
  const { data: opData, refetch: refetchOps } = useGetReloadlyOperatorsQuery({ countryIso });
  const [saveMappings, { isLoading: saving }] = useSaveOperatorMappingsMutation();
  const [operatorsOpen, setOperatorsOpen] = useState(false);

  const txBlock = data?.transactions as Paginated<Record<string, unknown>> | undefined;
  const canEdit = Boolean(data?.can_edit_mappings);
  const storedMappings = (data?.stored_mappings ?? []) as Array<Record<string, unknown>>;

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
      void refetch();
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
          subtitle={`Top-up transactions · saved mappings override environment fallbacks · ${countryIso}`}
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

      {isError ? (
        <p className="text-destructive text-sm">Could not load airtime data.</p>
      ) : null}

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

      <Card className="rounded-none">
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-muted-foreground p-6 text-sm">Loading…</p>
          ) : (
            <>
              <Table>
                <TableHeader className="admin-table-heavy-divider">
                  <TableRow>
                    <TableHead className="admin-table-head">#</TableHead>
                    <TableHead className="admin-table-head">User</TableHead>
                    <TableHead className="admin-table-head">Recipient</TableHead>
                    <TableHead className="admin-table-head">Operator</TableHead>
                    <TableHead className="admin-table-head">Amount</TableHead>
                    <TableHead className="admin-table-head">Status</TableHead>
                    <TableHead className="admin-table-head">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(txBlock?.items ?? []).map((row) => {
                    const r = row as Record<string, unknown>;
                    const user = (r.user ?? null) as
                      | { uuid?: string; name?: string | null; phone_number?: string | null }
                      | null;
                    const userLabel = String(user?.name ?? user?.phone_number ?? "—");
                    const userUuid = String(user?.uuid ?? "");
                    const recipient = String(r.recipient ?? r.recipient_phone ?? "—");
                    const operatorId = String(r.operator_id ?? "—");
                    const currency = String(r.currency ?? "");
                    const amount = Number(r.amount ?? 0);
                    const status = String(r.status ?? "");
                    const when = formatAirtimeWhen(String(r.created_at ?? ""));
                    return (
                      <TableRow key={String(r.id)}>
                        <TableCell className="font-mono text-xs">{String(r.id)}</TableCell>
                        <TableCell>
                          {userUuid ? (
                            <Link
                              href={`/users/${encodeURIComponent(userUuid)}`}
                              className="text-foreground text-sm font-medium hover:underline"
                            >
                              {userLabel}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{recipient}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {operatorId}
                        </TableCell>
                        <TableCell className="text-sm">
                          {Number.isFinite(amount) ? formatDecimalAmount(amount) : "—"}{" "}
                          <span className="text-muted-foreground">{currency}</span>
                        </TableCell>
                        <TableCell>
                          {status ? <Badge variant="gray">{status}</Badge> : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {when}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!txBlock?.items?.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground py-8">
                        No airtime transactions yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
              <PaginationControls
                className="p-4"
                meta={txBlock?.meta}
                page={page}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
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

function formatDecimalAmount(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  const fixed4 = value.toFixed(4);
  const [intPart, decPartRaw] = fixed4.split(".");
  const decTrimmed = decPartRaw.replace(/0+$/, "");
  const dec = decTrimmed.length < 2 ? decPartRaw.slice(0, 2) : decTrimmed;
  return `${intPart}.${dec}`;
}

function formatAirtimeWhen(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
