"use client";

import { useState } from "react";
import { useGetNotificationsQuery } from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
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
    | (Paginated<Record<string, unknown>> & { filters?: { event_types?: string[] } })
    | undefined;

  const eventTypes = list?.filters?.event_types ?? [];

  return (
    <article className="space-y-6">
      <AdminPageHeader
        title="Push Notification Logs"
        subtitle={`${formatCount(Number(list?.meta?.total ?? 0))} total delivery records`}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:flex-wrap md:items-end">
          <div className="space-y-2">
            <Label htmlFor="n-status">Status</Label>
            <select
              id="n-status"
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
              }}
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="n-event">Event type</Label>
            <select
              id="n-event"
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
              }}
            >
              <option value="">All events</option>
              {eventTypes.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-48 flex-1 space-y-2">
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
          {applied.status || applied.event_type || applied.search ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStatus("");
                setEventType("");
                setSearch("");
                setApplied({ status: "", event_type: "", search: "" });
                setPage(1);
              }}
            >
              Clear
            </Button>
          ) : null}
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
                    <TableHead>#</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>FCM Message ID</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(list?.items ?? []).map((row) => {
                    const r = row as Record<string, unknown>;
                    const user = (r.user ?? null) as
                      | { uuid?: string; name?: string | null; phone_number?: string | null }
                      | null;
                    const userLabel = String(user?.name ?? user?.phone_number ?? "—");
                    const userSub = user?.name ? String(user?.phone_number ?? "") : "";
                    const userUuid = String(user?.uuid ?? "");
                    return (
                      <TableRow key={String(r.id)}>
                        <TableCell className="font-mono text-xs">{String(r.id)}</TableCell>
                        <TableCell>
                          {userUuid ? (
                            <Link
                              href={`/users/${encodeURIComponent(userUuid)}`}
                              className="text-foreground text-sm font-medium hover:underline"
                            >
                              {userLabel}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {userSub ? (
                            <div className="text-muted-foreground font-mono text-[11px]">{userSub}</div>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {String(r.event_type ?? "—")}
                        </TableCell>
                        <TableCell>
                          {String(r.status ?? "") === "success" ? (
                            <Badge variant="white">Success</Badge>
                          ) : String(r.status ?? "") === "failed" ? (
                            <Badge variant="dark">Failed</Badge>
                          ) : (
                            <Badge variant="gray">{String(r.status ?? "—")}</Badge>
                          )}
                        </TableCell>
                        <TableCell
                          className="font-mono text-[11px] text-muted-foreground max-w-[160px] truncate"
                          title={String(r.fcm_message_id ?? "")}
                        >
                          {String(r.fcm_message_id ?? "—")}
                        </TableCell>
                        <TableCell
                          className="text-xs text-foreground max-w-[220px] truncate"
                          title={String(r.error_message ?? "")}
                        >
                          {String(r.error_message ?? "—")}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {String(r.created_at ?? "—")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!list?.items?.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                        No notification logs found.
                      </TableCell>
                    </TableRow>
                  ) : null}
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

function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString();
}
