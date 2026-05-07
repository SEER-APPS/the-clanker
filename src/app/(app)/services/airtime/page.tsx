"use client";

import { useState } from "react";
import {
  useGetReloadlyAirtimeQuery,
  useGetReloadlyOperatorsQuery,
  useSaveOperatorMappingsMutation,
} from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function AirtimePage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetReloadlyAirtimeQuery({ page });
  const countryIso = String(data?.country_iso ?? "GH");
  const { data: opData, refetch: refetchOps } = useGetReloadlyOperatorsQuery({ countryIso });
  const [saveMappings, { isLoading: saving }] = useSaveOperatorMappingsMutation();
  const [mappingJson, setMappingJson] = useState("");

  const txBlock = data?.transactions as Paginated<Record<string, unknown>> | undefined;
  const canEdit = Boolean(data?.can_edit_mappings);

  async function onSaveMappings(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    try {
      const parsed = JSON.parse(mappingJson) as unknown;
      if (!Array.isArray(parsed)) {
        toast.error("Mappings must be a JSON array.");
        return;
      }
      await saveMappings({
        country_iso: countryIso,
        mappings: parsed,
      }).unwrap();
      toast.success("Mappings saved.");
      void refetch();
      void refetchOps();
    } catch (err: unknown) {
      if (err instanceof SyntaxError) {
        toast.error("Invalid JSON.");
        return;
      }
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Save failed.")
          : "Save failed.";
      toast.error(msg);
    }
  }

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Airtime</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Reloadly airtime history and operator ID mappings ({countryIso}).
        </p>
      </header>

      {isError ? (
        <p className="text-destructive text-sm">Could not load airtime data.</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Recipient</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(txBlock?.items ?? []).map((row) => {
                    const r = row as Record<string, unknown>;
                    return (
                      <TableRow key={String(r.id)}>
                        <TableCell className="font-mono text-xs">{String(r.id)}</TableCell>
                        <TableCell>{String(r.status ?? "—")}</TableCell>
                        <TableCell>{String(r.amount ?? "—")}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {String(r.recipient_phone ?? "—")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PaginationControls
                className="mt-4"
                meta={txBlock?.meta}
                page={page}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operators snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="mb-3"
            onClick={() => {
              void refetchOps();
            }}
          >
            Refresh operators
          </Button>
          <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 font-mono text-xs">
            {JSON.stringify(opData ?? {}, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Save operator mappings (super admin)</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                void onSaveMappings(e);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="map-json">Mappings JSON array</Label>
                <Textarea
                  id="map-json"
                  value={mappingJson}
                  onChange={(e) => {
                    setMappingJson(e.target.value);
                  }}
                  placeholder='[{"telco_slug":"mtn_gh","operator_id":123,"operator_id_data":456}]'
                  className="font-mono text-xs"
                  rows={6}
                />
              </div>
              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save mappings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </article>
  );
}
