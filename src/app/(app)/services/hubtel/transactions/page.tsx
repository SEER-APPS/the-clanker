"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useGetHubtelTransactionsQuery,
  useHubtelBatchArchiveMutation,
  useHubtelBatchDeleteMutation,
  useHubtelBatchRefreshStatusMutation,
} from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
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

export default function HubtelTransactionsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [product, setProduct] = useState("");
  const [status, setStatus] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [applied, setApplied] = useState({
    product: "",
    status: "",
    include_archived: false,
    include_deleted: false,
  });
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const queryArgs = useMemo(
    () => ({
      page,
      product: applied.product || undefined,
      status: applied.status || undefined,
      include_archived: applied.include_archived,
      include_deleted: applied.include_deleted,
    }),
    [page, applied],
  );

  const { data, isLoading, isError, refetch } = useGetHubtelTransactionsQuery(queryArgs);
  const [batchDelete, { isLoading: dBusy }] = useHubtelBatchDeleteMutation();
  const [batchArchive, { isLoading: aBusy }] = useHubtelBatchArchiveMutation();
  const [batchRefresh, { isLoading: rBusy }] = useHubtelBatchRefreshStatusMutation();

  const txWrap = data as Paginated<Record<string, unknown>> | undefined;
  const rows = txWrap?.items ?? [];

  function toggle(id: number, on: boolean): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function toggleAll(on: boolean): void {
    if (!on) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(rows.map((r) => Number((r as Record<string, unknown>).id))));
  }

  async function runBatch(
    kind: "delete" | "archive" | "refresh",
  ): Promise<void> {
    const ids = [...selected];
    if (ids.length < 1) {
      toast.error("Select at least one row.");
      return;
    }
    if (kind === "delete" && !window.confirm(`Delete ${ids.length} transaction(s)?`)) {
      return;
    }
    try {
      if (kind === "delete") {
        await batchDelete({ ids }).unwrap();
      } else if (kind === "archive") {
        await batchArchive({ ids }).unwrap();
      } else {
        await batchRefresh({ ids }).unwrap();
      }
      toast.success("Batch job completed.");
      setSelected(new Set());
      void refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Batch failed.")
          : "Batch failed.";
      toast.error(msg);
    }
  }

  return (
    <article className="space-y-6">
      <header>
        <Link
          href="/services/hubtel"
          className="text-muted-foreground text-sm hover:underline"
        >
          Back to Hubtel
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Transactions</h1>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:flex-wrap md:items-end">
          <div className="space-y-2">
            <Label htmlFor="ht-p">Product</Label>
            <Input
              id="ht-p"
              value={product}
              onChange={(e) => {
                setProduct(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ht-s">Status</Label>
            <Input
              id="ht-s"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => {
                setIncludeArchived(e.target.checked);
              }}
            />
            Include archived
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.target.checked);
              }}
            />
            Include deleted
          </label>
          <Button
            type="button"
            onClick={() => {
              setApplied({
                product,
                status,
                include_archived: includeArchived,
                include_deleted: includeDeleted,
              });
              setPage(1);
            }}
          >
            Apply filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">Results</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={dBusy}
              onClick={() => {
                void runBatch("delete");
              }}
            >
              Batch delete
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={aBusy}
              onClick={() => {
                void runBatch("archive");
              }}
            >
              Batch archive
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={rBusy}
              onClick={() => {
                void runBatch("refresh");
              }}
            >
              Batch refresh status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="text-destructive text-sm">Could not load transactions.</p>
          ) : null}
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        checked={rows.length > 0 && selected.size === rows.length}
                        onChange={(e) => {
                          toggleAll(e.target.checked);
                        }}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const r = row as Record<string, unknown>;
                    const id = Number(r.id);
                    return (
                      <TableRow key={id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selected.has(id)}
                            onChange={(e) => {
                              toggle(id, e.target.checked);
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <Link
                            href={`/services/hubtel/transactions/${id}`}
                            className="text-primary hover:underline"
                          >
                            {id}
                          </Link>
                        </TableCell>
                        <TableCell>{String(r.product ?? "—")}</TableCell>
                        <TableCell>{String(r.status ?? "—")}</TableCell>
                        <TableCell>{String(r.amount ?? "—")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PaginationControls
                className="mt-4"
                meta={txWrap?.meta}
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
