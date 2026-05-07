"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetThreatAlertsQuery } from "@/store/admin-api";
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

export default function ThreatAlertsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState({ status: "", type: "", search: "" });

  const { data, isLoading, isError } = useGetThreatAlertsQuery({
    page,
    status: applied.status || undefined,
    type: applied.type || undefined,
    search: applied.search || undefined,
  });

  const list = data as
    | (Paginated<Record<string, unknown>> & { filters?: Record<string, unknown> })
    | undefined;

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Threat alerts</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review distress signals and their delivery state.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:flex-wrap md:items-end">
          <div className="space-y-2">
            <Label htmlFor="ta-status">Status</Label>
            <Input
              id="ta-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
              }}
              placeholder="pending, confirmed…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ta-type">Type</Label>
            <Input
              id="ta-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
              }}
              placeholder="robbery, kidnapping…"
            />
          </div>
          <div className="min-w-[12rem] flex-1 space-y-2">
            <Label htmlFor="ta-search">User search</Label>
            <Input
              id="ta-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Phone or name"
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              setApplied({ status, type, search });
              setPage(1);
            }}
          >
            Apply
          </Button>
        </CardContent>
      </Card>

      {isError ? (
        <p className="text-destructive text-sm">Could not load alerts.</p>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(list?.items ?? []).map((row) => {
                    const r = row as Record<string, unknown>;
                    const id = Number(r.id);
                    const u = r.user as Record<string, unknown> | undefined;
                    return (
                      <TableRow key={id}>
                        <TableCell className="font-mono text-xs">
                          <Link
                            href={`/threat-alerts/${id}`}
                            className="text-primary hover:underline"
                          >
                            {id}
                          </Link>
                        </TableCell>
                        <TableCell>{String(r.threat_type)}</TableCell>
                        <TableCell>{String(r.status)}</TableCell>
                        <TableCell>{u ? String(u.phone_number ?? u.name ?? "—") : "—"}</TableCell>
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
