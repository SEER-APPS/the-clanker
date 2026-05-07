"use client";

import { useState } from "react";
import { useGetReloadlyPrepaidQuery } from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PrepaidPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetReloadlyPrepaidQuery({ page });
  const txBlock = data?.transactions as Paginated<Record<string, unknown>> | undefined;

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Prepaid (data)</h1>
        <p className="text-muted-foreground mt-1 text-sm">Reloadly data top-up transactions.</p>
      </header>

      {isError ? (
        <p className="text-destructive text-sm">Could not load prepaid data.</p>
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
    </article>
  );
}
