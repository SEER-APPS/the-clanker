"use client";

import { useState } from "react";
import { useGetNotificationsQuery } from "@/store/admin-api";
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

export default function NotificationsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [eventType, setEventType] = useState("");
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState({ status: "", event_type: "", search: "" });

  const { data, isLoading, isError } = useGetNotificationsQuery({
    page,
    status: applied.status || undefined,
    event_type: applied.event_type || undefined,
    search: applied.search || undefined,
  });

  const list = data as
    | (Paginated<Record<string, unknown>> & { event_types?: string[] })
    | undefined;

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Push notification logs</h1>
        <p className="text-muted-foreground mt-1 text-sm">Delivery attempts and failures.</p>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:flex-wrap md:items-end">
          <div className="space-y-2">
            <Label htmlFor="n-status">Status</Label>
            <Input
              id="n-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="n-event">Event type</Label>
            <Input
              id="n-event"
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
              }}
            />
          </div>
          <div className="min-w-[12rem] flex-1 space-y-2">
            <Label htmlFor="n-search">User search</Label>
            <Input
              id="n-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              setApplied({ status, event_type: eventType, search });
              setPage(1);
            }}
          >
            Apply
          </Button>
        </CardContent>
      </Card>

      {isError ? (
        <p className="text-destructive text-sm">Could not load logs.</p>
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
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(list?.items ?? []).map((row) => {
                    const r = row as Record<string, unknown>;
                    return (
                      <TableRow key={String(r.id)}>
                        <TableCell className="font-mono text-xs">{String(r.id)}</TableCell>
                        <TableCell>{String(r.event_type ?? "—")}</TableCell>
                        <TableCell>{String(r.status ?? "—")}</TableCell>
                        <TableCell className="text-xs">{String(r.created_at ?? "—")}</TableCell>
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
