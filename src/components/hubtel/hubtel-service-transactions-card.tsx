"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useGetHubtelTransactionsQuery } from "@/store/admin-api";
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
import { AdminTableBodySkeleton } from "@/components/admin/admin-loading-skeletons";
import { HubtelStatusBadge } from "@/components/hubtel/hubtel-status-badge";

type HubtelServiceTransactionsCardProps = {
  title?: string;
  productGroup?: "airtime" | "utilities";
  product?: string;
  products?: string;
  showStatusFilter?: boolean;
  utilityProductFilter?: React.ReactNode;
};

export function HubtelServiceTransactionsCard({
  title = "Transactions",
  productGroup,
  product: fixedProduct,
  products: fixedProducts,
  showStatusFilter = true,
  utilityProductFilter,
}: HubtelServiceTransactionsCardProps): React.ReactElement {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [status, setStatus] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");

  const queryArgs = useMemo(
    () => ({
      page,
      per_page: perPage,
      ...(productGroup ? { product_group: productGroup } : {}),
      ...(fixedProduct ? { product: fixedProduct } : {}),
      ...(fixedProducts ? { products: fixedProducts } : {}),
      ...(appliedStatus ? { status: appliedStatus } : {}),
    }),
    [page, perPage, productGroup, fixedProduct, fixedProducts, appliedStatus],
  );

  const { data, isLoading, isError } = useGetHubtelTransactionsQuery(queryArgs);
  const txWrap = data as Paginated<Record<string, unknown>> | undefined;
  const rows = txWrap?.items ?? [];

  return (
    <Card className="rounded-none">
      <CardHeader className="border-b py-3">
        <CardTitle className="admin-card-title">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0 pt-0">
        {(showStatusFilter || utilityProductFilter) && (
          <div className="flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:flex-wrap md:items-end">
            {utilityProductFilter}
            {showStatusFilter ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ht-status-filter">Status</Label>
                  <Input
                    id="ht-status-filter"
                    value={status}
                    placeholder="e.g. success, pending"
                    onChange={(e) => {
                      setStatus(e.target.value);
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setAppliedStatus(status.trim());
                    setPage(1);
                  }}
                >
                  Apply
                </Button>
              </>
            ) : null}
          </div>
        )}

        {isError ? (
          <p className="text-destructive px-4 py-2 text-sm">Could not load Hubtel transactions.</p>
        ) : null}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="admin-table-heavy-divider">
              <TableRow>
                <TableHead className="admin-table-head">Reference</TableHead>
                <TableHead className="admin-table-head">Product</TableHead>
                <TableHead className="admin-table-head">Recipient</TableHead>
                <TableHead className="admin-table-head">User</TableHead>
                <TableHead className="admin-table-head">Status</TableHead>
                <TableHead className="admin-table-head text-right">Amount</TableHead>
                <TableHead className="admin-table-head">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <AdminTableBodySkeleton
                  rows={8}
                  cellWidths={["w-28", "w-20", "w-24", "w-24", "w-16", "w-16", "w-24"]}
                />
              ) : (
                <>
                  {rows.map((row) => {
                    const r = row as Record<string, unknown>;
                    const id = Number(r.id);
                    const uuid = String(r.uuid ?? "");
                    const hrefKey = uuid || String(id);
                    const displayStatus = String(r.display_status ?? r.status ?? "");
                    const ref = String(r.client_reference ?? (uuid || id));
                    const user = (r.user ?? null) as
                      | { uuid?: string; name?: string | null; phone_number?: string | null }
                      | null;
                    const userLabel = String(user?.name ?? user?.phone_number ?? "—");
                    const userUuid = String(user?.uuid ?? "");
                    const when = formatWhen(String(r.created_at ?? ""));
                    return (
                      <TableRow key={id}>
                        <TableCell className="max-w-[200px]">
                          <Link
                            href={`/services/hubtel/transactions/${encodeURIComponent(hrefKey)}`}
                            className="font-mono text-xs text-primary hover:underline"
                          >
                            {ref}
                          </Link>
                        </TableCell>
                        <TableCell>{String(r.product_label ?? r.product ?? "—")}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {String(r.recipient ?? "—")}
                        </TableCell>
                        <TableCell>
                          {userUuid ? (
                            <Link
                              href={`/users/${encodeURIComponent(userUuid)}`}
                              className="text-sm hover:underline"
                            >
                              {userLabel}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <HubtelStatusBadge status={displayStatus} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {typeof r.amount === "number"
                            ? `GHS ${r.amount.toFixed(2)}`
                            : String(r.amount ?? "—")}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {when}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!rows.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground py-8">
                        No transactions yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading ? (
          <PaginationControls
            className="px-4 pb-4"
            meta={txWrap?.meta}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(next) => {
              setPerPage(next);
              setPage(1);
            }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatWhen(iso: string): string {
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
