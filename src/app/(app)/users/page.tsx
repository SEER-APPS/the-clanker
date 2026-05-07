"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useGetUsersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useDeleteUserMutation,
} from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";

export default function UsersPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, refetch } = useGetUsersQuery({
    page,
    search: appliedSearch || undefined,
    status,
  });

  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const list = data as Paginated<Record<string, unknown>> | undefined;

  async function run(
    action: "block" | "unblock" | "delete",
    id: number,
  ): Promise<void> {
    if (action === "delete" && !window.confirm("Delete this user permanently?")) {
      return;
    }
    try {
      if (action === "block") {
        await blockUser(id).unwrap();
        toast.success("User blocked.");
      } else if (action === "unblock") {
        await unblockUser(id).unwrap();
        toast.success("User unblocked.");
      } else {
        await deleteUser(id).unwrap();
        toast.success("User deleted.");
      }
      void refetch();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "data" in e
          ? String((e as { data?: { message?: string } }).data?.message ?? "Action failed.")
          : "Action failed.";
      toast.error(msg);
    }
  }

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Search, filter, and manage end-user accounts.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="user-search">Search</Label>
            <Input
              id="user-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Name or phone"
            />
          </div>
          <div className="w-full space-y-2 md:w-48">
            <Label htmlFor="user-status">Status</Label>
            <select
              id="user-status"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={status ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setStatus(v === "" ? undefined : v);
                setPage(1);
              }}
            >
              <option value="">Any</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button
            type="button"
            onClick={() => {
              setAppliedSearch(search);
              setPage(1);
            }}
          >
            Apply
          </Button>
        </CardContent>
      </Card>

      {isError ? (
        <p className="text-destructive text-sm">Could not load users.</p>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Blocked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(list?.items ?? []).map((row) => {
                    const r = row as Record<string, unknown>;
                    const id = Number(r.id);
                    const blocked = Boolean(r.is_blocked);
                    return (
                      <TableRow key={id}>
                        <TableCell className="font-mono text-xs">{id}</TableCell>
                        <TableCell>
                          <Link
                            href={`/users/${id}`}
                            className="text-primary font-medium hover:underline"
                          >
                            {String(r.name ?? "—")}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {String(r.phone_number ?? "—")}
                        </TableCell>
                        <TableCell>{blocked ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {blocked ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  void run("unblock", id);
                                }}
                              >
                                Unblock
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  void run("block", id);
                                }}
                              >
                                Block
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                void run("delete", id);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PaginationControls
                className="mt-4"
                meta={list?.meta}
                page={page}
                onPageChange={(p) => {
                  setPage(p);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </article>
  );
}
