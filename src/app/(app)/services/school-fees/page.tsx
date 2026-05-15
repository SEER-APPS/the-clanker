"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetSchoolFeesQuery } from "@/store/admin-api";
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
import { AdminTableBodySkeleton } from "@/components/admin/admin-loading-skeletons";

export default function SchoolFeesPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetSchoolFeesQuery({ page });
  const list = data as Paginated<Record<string, unknown>> | undefined;

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">School fees</h1>
        <p className="text-muted-foreground mt-1 text-sm">Payment requests and status.</p>
      </header>
      {isError ? (
        <p className="text-destructive text-sm">Could not load records.</p>
      ) : null}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <AdminTableBodySkeleton rows={8} cellWidths={["w-14", "w-20", "w-16"]} />
              ) : (
                (list?.items ?? []).map((row) => {
                  const r = row as Record<string, unknown>;
                  const id = Number(r.id);
                  return (
                    <TableRow key={id}>
                      <TableCell>
                        <Link
                          href={`/services/school-fees/${id}`}
                          className="text-primary font-mono text-xs hover:underline"
                        >
                          {id}
                        </Link>
                      </TableCell>
                      <TableCell>{String(r.status ?? "—")}</TableCell>
                      <TableCell>{String(r.amount ?? "—")}</TableCell>
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
