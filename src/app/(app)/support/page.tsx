"use client";

import { useState } from "react";
import { useGetSupportConversationsQuery } from "@/store/admin-api";
import { SupportConversationRow } from "@/components/admin/support-conversation-row";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminTableBodySkeleton } from "@/components/admin/admin-loading-skeletons";

function formatRelative(dateIso: string | null): string {
  if (!dateIso) {
    return "—";
  }
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  const deltaMs = Date.now() - d.getTime();
  const mins = Math.floor(deltaMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SupportPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetSupportConversationsQuery({ page });
  const list = data as Paginated<Record<string, unknown>> | undefined;

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">App Support</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Customer support conversations from the mobile app.
        </p>
      </header>

      {isError ? (
        <p className="text-destructive text-sm">Could not load support conversations.</p>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Last message</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <AdminTableBodySkeleton rows={8} cellWidths={["w-28", "w-48", "w-16", "w-16"]} />
              ) : (
                (list?.items ?? []).map((row) => {
                  const item = row as Record<string, unknown>;
                  const customer = item.customer as Record<string, unknown> | undefined;
                  const uuid = String(item.uuid ?? "");
                  const unread = Boolean(item.unread);
                  return (
                    <SupportConversationRow key={uuid} conversationUuid={uuid}>
                      <TableCell>
                        <div className="text-foreground font-medium">
                          {String(customer?.name ?? "Customer")}
                        </div>
                        <div className="text-muted-foreground font-mono text-xs">
                          {String(customer?.phone ?? "—")}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {String(item.last_message ?? "—")}
                      </TableCell>
                      <TableCell>{formatRelative(String(item.last_message_at ?? ""))}</TableCell>
                      <TableCell>
                        {unread ? <Badge variant="dark">Unread</Badge> : <Badge variant="gray">Read</Badge>}
                      </TableCell>
                    </SupportConversationRow>
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
