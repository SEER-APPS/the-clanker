"use client";

import { useState } from "react";
import { useGetAnalyticsFailuresQuery } from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminTableBodySkeleton } from "@/components/admin/admin-loading-skeletons";

export default function AnalyticsFailuresPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [product, setProduct] = useState("");
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState({ product: "", search: "" });

  const { data, isLoading, isError } = useGetAnalyticsFailuresQuery({
    page,
    product: applied.product || undefined,
    search: applied.search || undefined,
  });

  const block = data as
    | { transactions?: Paginated<Record<string, unknown>>; filters?: Record<string, string> }
    | undefined;
  const list = block?.transactions;

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/services/analytics"
          className={buttonVariants({ variant: "link", size: "sm" })}
        >
          Back to analytics
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Reloadly failures</h1>
      </header>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-2">
            <Label htmlFor="af-prod">Product</Label>
            <Input
              id="af-prod"
              value={product}
              onChange={(e) => {
                setProduct(e.target.value);
              }}
              placeholder="airtime or data"
            />
          </div>
          <div className="min-w-[12rem] flex-1 space-y-2">
            <Label htmlFor="af-search">Search</Label>
            <Input
              id="af-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              setApplied({ product, search });
              setPage(1);
            }}
          >
            Apply
          </Button>
        </CardContent>
      </Card>

      {isError ? (
        <p className="text-destructive text-sm">Could not load failures.</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Recipient</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <AdminTableBodySkeleton rows={8} cellWidths={["w-14", "w-20", "w-28"]} />
              ) : (list?.items ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground py-8 text-center text-sm">
                    No failed Reloadly transactions found. On a fresh Prisma database the{" "}
                    <code className="text-xs">reloadly_transactions</code> table may not exist yet —
                    failures will appear once that table is migrated and transactions fail.
                  </TableCell>
                </TableRow>
              ) : (
                (list?.items ?? []).map((row) => {
                  const r = row as Record<string, unknown>;
                  return (
                    <TableRow key={String(r.id)}>
                      <TableCell className="font-mono text-xs">{String(r.id)}</TableCell>
                      <TableCell>{String(r.product ?? "—")}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {String(r.recipient ?? "—")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {!isLoading ? (
            <PaginationControls
              className="mt-4"
              meta={list?.meta}
              page={page}
              onPageChange={setPage}
            />
          ) : null}
        </CardContent>
      </Card>
    </article>
  );
}
