"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  useGetUsersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useDeleteUserMutation,
} from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const APPLY_FEEDBACK_MS = 1600;

export default function UsersPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [applyState, setApplyState] = useState<"idle" | "applied">("idle");
  const applyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isError, refetch } = useGetUsersQuery({
    page,
    search: appliedSearch || undefined,
    status,
  });

  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [actionKey, setActionKey] = useState<string | null>(null);

  const list = data as Paginated<Record<string, unknown>> | undefined;
  const showTableSkeleton = isLoading && !list;
  const skeletonRowCount = Math.min(Number(list?.meta?.per_page ?? 10), 12);

  useEffect(() => {
    return () => {
      if (applyResetTimerRef.current) {
        clearTimeout(applyResetTimerRef.current);
      }
    };
  }, []);

  async function run(
    action: "block" | "unblock" | "delete",
    uuid: string,
  ): Promise<void> {
    if (action === "delete" && !window.confirm("Delete this user permanently?")) {
      return;
    }
    const key = `${uuid}:${action}`;
    setActionKey(key);
    try {
      if (action === "block") {
        await blockUser(uuid).unwrap();
        toast.success("User blocked.");
      } else if (action === "unblock") {
        await unblockUser(uuid).unwrap();
        toast.success("User unblocked.");
      } else {
        await deleteUser(uuid).unwrap();
        toast.success("User deleted.");
      }
      void refetch();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "data" in e
          ? String((e as { data?: { message?: string } }).data?.message ?? "Action failed.")
          : "Action failed.";
      toast.error(msg);
    } finally {
      setActionKey(null);
    }
  }

  function handleApplyFilters(): void {
    setAppliedSearch(search);
    setPage(1);
    setApplyState("applied");
    if (applyResetTimerRef.current) {
      clearTimeout(applyResetTimerRef.current);
    }
    applyResetTimerRef.current = setTimeout(() => {
      setApplyState("idle");
      applyResetTimerRef.current = null;
    }, APPLY_FEEDBACK_MS);
  }

  return (
    <article className="space-y-6">
      <AdminPageHeader
        title="Users"
        subtitle="Search, filter, and manage end-user accounts."
      />

      <Card className="rounded-none">
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">Filters</CardTitle>
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
            disabled={applyState === "applied"}
            onClick={() => {
              handleApplyFilters();
            }}
          >
            {applyState === "applied" ? "Applied" : "Apply"}
          </Button>
        </CardContent>
      </Card>

      {isError ? (
        <p className="text-destructive text-sm">Could not load users.</p>
      ) : null}

      <Card className="rounded-none">
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">User List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="admin-table-heavy-divider">
              <TableRow>
                <TableHead className="admin-table-head">ID</TableHead>
                <TableHead className="admin-table-head">Name</TableHead>
                <TableHead className="admin-table-head">Phone</TableHead>
                <TableHead className="admin-table-head">Blocked</TableHead>
                <TableHead className="admin-table-head w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showTableSkeleton ? (
                Array.from({ length: skeletonRowCount }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36 max-w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (list?.items ?? []).length ? (
                (list?.items ?? []).map((row, index) => {
                  const r = row as Record<string, unknown>;
                  const uuid = String(r.uuid ?? "");
                  const blocked = Boolean(r.is_blocked);
                  const perPage = Number(list?.meta?.per_page ?? 20);
                  const rowNumber = (page - 1) * perPage + index + 1;
                  const busy = actionKey !== null;
                  return (
                    <TableRow key={uuid || index}>
                      <TableCell className="font-mono text-xs">{rowNumber}</TableCell>
                      <TableCell>
                        <Link
                          href={`/users/${encodeURIComponent(uuid)}`}
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
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "icon-sm" }),
                              "shrink-0",
                            )}
                            disabled={busy}
                            aria-label="User actions"
                          >
                            {actionKey?.startsWith(`${uuid}:`) ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <MoreHorizontal className="size-4" aria-hidden="true" />
                            )}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-40">
                            {blocked ? (
                              <DropdownMenuItem
                                disabled={busy}
                                onClick={() => {
                                  void run("unblock", uuid);
                                }}
                              >
                                Unblock
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                disabled={busy}
                                onClick={() => {
                                  void run("block", uuid);
                                }}
                              >
                                Block
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={busy}
                              onClick={() => {
                                void run("delete", uuid);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="px-3.5 py-8 text-center text-sm text-muted-foreground">
                    No users match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {!showTableSkeleton ? (
            <PaginationControls
              className="p-4"
              meta={list?.meta}
              page={page}
              onPageChange={(p) => {
                setPage(p);
              }}
            />
          ) : null}
        </CardContent>
      </Card>
    </article>
  );
}
