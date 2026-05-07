"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetTicketsQuery } from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TicketsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetTicketsQuery({ page });
  const list = data as Paginated<Record<string, unknown>> | undefined;

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ticket bookings</h1>
      </header>
      {isError ? (
        <p className="text-destructive text-sm">Could not load records.</p>
      ) : null}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Route</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(list?.items ?? []).map((row) => {
                    const r = row as Record<string, unknown>;
                    const id = Number(r.id);
                    return (
                      <TableRow key={id}>
                        <TableCell>
                          <Link
                            href={`/services/tickets/${id}`}
                            className="text-primary font-mono text-xs hover:underline"
                          >
                            {id}
                          </Link>
                        </TableCell>
                        <TableCell>{String(r.status ?? "—")}</TableCell>
                        <TableCell>{String(r.route_label ?? r.route ?? "—")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PaginationControls
                className="mt-4"
                meta={list?.meta}
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
