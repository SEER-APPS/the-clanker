"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetConversationsQuery } from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminTableBodySkeleton } from "@/components/admin/admin-loading-skeletons";

export default function ConversationsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [appliedType, setAppliedType] = useState<string | undefined>(undefined);

  const { data, isLoading, isError } = useGetConversationsQuery({
    page,
    type: appliedType,
  });

  const list = data as Paginated<Record<string, unknown>> | undefined;

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
        <p className="text-muted-foreground mt-1 text-sm">Direct and group threads.</p>
      </header>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-2">
            <Label htmlFor="conv-type">Type</Label>
            <Input
              id="conv-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
              }}
              placeholder="direct or group"
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              setAppliedType(type || undefined);
              setPage(1);
            }}
          >
            Apply
          </Button>
        </CardContent>
      </Card>

      {isError ? (
        <p className="text-destructive text-sm">Could not load conversations.</p>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Messages</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <AdminTableBodySkeleton rows={8} cellWidths={["w-16", "w-20", "w-12"]} />
              ) : (
                (list?.items ?? []).map((row) => {
                  const r = row as Record<string, unknown>;
                  const id = Number(r.id);
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/conversations/${id}`}
                          className="text-primary hover:underline"
                        >
                          {id}
                        </Link>
                      </TableCell>
                      <TableCell>{String(r.type)}</TableCell>
                      <TableCell>{String(r.messages_count ?? "—")}</TableCell>
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
