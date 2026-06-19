"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, MoreHorizontal } from "lucide-react";
import {
  useGetNotificationsQuery,
  useGetNotificationsStatusQuery,
  useGetUsersQuery,
  useSendAdminNotificationMutation,
} from "@/store/admin-api";
import type { Paginated } from "@/types/admin";
import { formatAdminMutationError, readAdminField } from "@/lib/admin-api-envelope";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTableBodySkeleton } from "@/components/admin/admin-loading-skeletons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const [selectedUserUuids, setSelectedUserUuids] = useState<Set<string>>(() => new Set());

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTemplate, setComposeTemplate] = useState<
    "admin_announcement" | "admin_test" | "chat_open" | "chat_location_preview" | "status_view"
  >("admin_announcement");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeConversation, setComposeConversation] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeLat, setComposeLat] = useState("");
  const [composeLng, setComposeLng] = useState("");
  const [composeStatusOwner, setComposeStatusOwner] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [appliedUserSearch, setAppliedUserSearch] = useState("");

  const { data, isLoading, isError } = useGetNotificationsQuery({
    page,
    status: applied.status || undefined,
    event_type: applied.event_type || undefined,
    search: applied.search || undefined,
  });
  const { data: pushStatus } = useGetNotificationsStatusQuery();
  const [sendPush, { isLoading: sendBusy }] = useSendAdminNotificationMutation();
  const { data: userSearchData } = useGetUsersQuery(
    { page: 1, search: appliedUserSearch || undefined },
    { skip: !composeOpen || appliedUserSearch.trim().length < 2 },
  );

  const list = data as
    | (Paginated<Record<string, unknown>> & { filters?: { event_types?: string[] } })
    | undefined;

  const eventTypes = list?.filters?.event_types ?? [];

  const pageSelectableUuids = useMemo(() => {
    const uuids = new Set<string>();
    for (const row of list?.items ?? []) {
      const r = row as Record<string, unknown>;
      const user = r.user as { uuid?: string } | null;
      const u = user?.uuid;
      if (u) {
        uuids.add(u);
      }
    }
    return uuids;
  }, [list?.items]);

  const selectedOnPage = useMemo(() => {
    let n = 0;
    for (const u of selectedUserUuids) {
      if (pageSelectableUuids.has(u)) {
        n += 1;
      }
    }
    return n;
  }, [pageSelectableUuids, selectedUserUuids]);

  const allOnPageSelected =
    pageSelectableUuids.size > 0 &&
    [...pageSelectableUuids].every((u) => selectedUserUuids.has(u));

  function toggleUser(uuid: string, checked: boolean): void {
    setSelectedUserUuids((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(uuid);
      } else {
        next.delete(uuid);
      }
      return next;
    });
  }

  function toggleSelectAllOnPage(): void {
    setSelectedUserUuids((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const u of pageSelectableUuids) {
          next.delete(u);
        }
      } else {
        for (const u of pageSelectableUuids) {
          next.add(u);
        }
      }
      return next;
    });
  }

  async function mutateSend(payload: Record<string, unknown>): Promise<void> {
    try {
      const result = await sendPush(payload).unwrap();
      const tokenCount = readAdminField<unknown>(result, "token_count");
      const userCount = readAdminField<unknown>(result, "user_count");
      const warning = readAdminField<string>(result, "warning");
      toast.success(
        `Sent (${String(tokenCount ?? "?")} token(s) for ${String(userCount ?? "?")} user(s)).${warning ? ` ${warning}` : ""}`,
      );
    } catch (error: unknown) {
      toast.error(formatAdminMutationError(error));
    }
  }

  async function submitCompose(target: "all_registered_devices" | "selected_users"): Promise<void> {
    if (composeTemplate === "admin_announcement" && (!composeTitle.trim() || !composeBody.trim())) {
      toast.error("Title and body are required for announcements.");
      return;
    }
    const payload: Record<string, unknown> = {
      target,
      ...(target === "selected_users"
        ? { user_uuids: [...selectedUserUuids] }
        : {}),
      template: composeTemplate,
    };
    const title = composeTitle.trim();
    const body = composeBody.trim();
    if (title) {
      payload.title = title;
    }
    if (body) {
      payload.body = body;
    }
    if (composeTemplate === "chat_open" || composeTemplate === "chat_location_preview") {
      payload.conversation_uuid = composeConversation.trim();
    }
    const msgTrim = composeMessage.trim();
    if (msgTrim) {
      payload.message_uuid = msgTrim;
    }
    if (composeTemplate === "chat_location_preview") {
      payload.latitude = Number(composeLat);
      payload.longitude = Number(composeLng);
    }
    if (composeTemplate === "status_view") {
      payload.status_owner_id = Number(composeStatusOwner);
    }
    await mutateSend(payload);
    setComposeOpen(false);
  }

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
        <AdminPageHeader
          title="Notifications"
          subtitle={`${formatCount(Number(list?.meta?.total ?? 0))} delivery records · compose and send push notifications to app users`}
        />
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
              <DialogTrigger
                render={
                  <Button type="button">
                    New notification
                  </Button>
                }
              />
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Send push notification</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="np-template">Type</Label>
                    <select
                      id="np-template"
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                      value={composeTemplate}
                      onChange={(e) => {
                        setComposeTemplate(e.target.value as typeof composeTemplate);
                      }}
                    >
                      <option value="admin_announcement">Announcement (title + message)</option>
                      <option value="admin_test">Admin test (opens Chats)</option>
                      <option value="chat_open">Open chat thread</option>
                      <option value="chat_location_preview">
                        Open chat + in-app map (location)
                      </option>
                      <option value="status_view">Open status viewer</option>
                    </select>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="np-title">
                        Title{composeTemplate === "admin_announcement" ? " *" : " (optional)"}
                      </Label>
                      <Input
                        id="np-title"
                        value={composeTitle}
                        onChange={(e) => {
                          setComposeTitle(e.target.value);
                        }}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="np-body">
                        Message{composeTemplate === "admin_announcement" ? " *" : " (optional)"}
                      </Label>
                      <Input
                        id="np-body"
                        value={composeBody}
                        onChange={(e) => {
                          setComposeBody(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 rounded-lg border p-3">
                    <Label htmlFor="np-user-search">Find users to target</Label>
                    <div className="flex gap-2">
                      <Input
                        id="np-user-search"
                        placeholder="Search name or phone"
                        value={userSearch}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAppliedUserSearch(userSearch.trim());
                        }}
                      >
                        Search
                      </Button>
                    </div>
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {((userSearchData as Paginated<Record<string, unknown>> | undefined)?.items ?? []).map(
                        (row) => {
                          const user = row as Record<string, unknown>;
                          const uuid = String(user.uuid ?? "");
                          const label = String(user.name ?? user.phone_number ?? uuid);
                          if (!uuid) {
                            return null;
                          }
                          return (
                            <label
                              key={uuid}
                              className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserUuids.has(uuid)}
                                onChange={(e) => {
                                  toggleUser(uuid, e.target.checked);
                                }}
                              />
                              <span>{label}</span>
                            </label>
                          );
                        },
                      )}
                      {appliedUserSearch.trim().length >= 2 &&
                      !((userSearchData as Paginated<Record<string, unknown>> | undefined)?.items?.length) ? (
                        <p className="text-muted-foreground px-2 py-1 text-xs">No users matched that search.</p>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {selectedUserUuids.size} user(s) selected for targeted sends.
                    </p>
                  </div>
                  {(composeTemplate === "chat_open" ||
                    composeTemplate === "chat_location_preview") && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="np-conv">Conversation UUID</Label>
                        <Input
                          id="np-conv"
                          className="font-mono text-xs"
                          value={composeConversation}
                          onChange={(e) => {
                            setComposeConversation(e.target.value);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="np-msg">Message UUID (optional, scroll in chat)</Label>
                        <Input
                          id="np-msg"
                          className="font-mono text-xs"
                          value={composeMessage}
                          onChange={(e) => {
                            setComposeMessage(e.target.value);
                          }}
                        />
                      </div>
                    </>
                  )}
                  {composeTemplate === "chat_location_preview" && (
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="np-lat">Latitude</Label>
                        <Input
                          id="np-lat"
                          inputMode="decimal"
                          value={composeLat}
                          onChange={(e) => {
                            setComposeLat(e.target.value);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="np-lng">Longitude</Label>
                        <Input
                          id="np-lng"
                          inputMode="decimal"
                          value={composeLng}
                          onChange={(e) => {
                            setComposeLng(e.target.value);
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {composeTemplate === "status_view" && (
                    <div className="space-y-2">
                      <Label htmlFor="np-owner">Status owner id (numeric API id)</Label>
                      <Input
                        id="np-owner"
                        inputMode="numeric"
                        value={composeStatusOwner}
                        onChange={(e) => {
                          setComposeStatusOwner(e.target.value);
                        }}
                      />
                    </div>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Send to all devices with a registered push token, or only the users you selected
                    above.
                  </p>
                </div>
                <DialogFooter className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={sendBusy}
                    onClick={() => {
                      void submitCompose("all_registered_devices");
                    }}
                  >
                    Send to all devices
                  </Button>
                  <Button
                    type="button"
                    disabled={sendBusy || selectedUserUuids.size === 0}
                    onClick={() => {
                      void submitCompose("selected_users");
                    }}
                  >
                    Send to selected ({selectedUserUuids.size})
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={sendBusy}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                Quick test
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px]">
                <DropdownMenuItem
                  onClick={() => {
                    void mutateSend({
                      target: "all_registered_devices",
                      template: "admin_test",
                    });
                  }}
                >
                  Test push → all registered devices
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={selectedUserUuids.size === 0}
                  onClick={() => {
                    void mutateSend({
                      target: "selected_users",
                      user_uuids: [...selectedUserUuids],
                      template: "admin_test",
                    });
                  }}
                >
                  Test push → selected users ({selectedUserUuids.size})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {sendBusy ? (
              <span className="text-muted-foreground flex items-center gap-2 text-xs">
                <Loader2 className="size-4 animate-spin" />
                Sending…
              </span>
            ) : null}
        </div>
      </header>

      {pushStatus && !pushStatus.fcm_configured ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="pt-6 text-sm text-amber-950 dark:text-amber-100">
            Push notifications are disabled on the API server. Set{" "}
            <code className="rounded bg-black/10 px-1 py-0.5 text-xs">FIREBASE_CREDENTIALS_JSON</code>{" "}
            (service account JSON) and{" "}
            <code className="rounded bg-black/10 px-1 py-0.5 text-xs">FCM_PROJECT_ID</code> on Railway for
            the core service, then redeploy. Until then, sends return HTTP 503.
          </CardContent>
        </Card>
      ) : null}

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
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
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

      {isError ? <p className="text-destructive text-sm">Could not load logs.</p> : null}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={() => {
                      toggleSelectAllOnPage();
                    }}
                    title="Select all users on this page"
                    aria-label="Select all on page"
                  />
                </TableHead>
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
              {isLoading ? (
                <AdminTableBodySkeleton
                  rows={8}
                  cellWidths={[
                    "w-8",
                    "w-10",
                    "w-28 max-w-full",
                    "w-32",
                    "w-16",
                    "w-28",
                    "w-24",
                    "w-24",
                  ]}
                />
              ) : (
                <>
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
                        <TableCell>
                          {userUuid ? (
                            <input
                              type="checkbox"
                              checked={selectedUserUuids.has(userUuid)}
                              onChange={(e) => {
                                toggleUser(userUuid, e.target.checked);
                              }}
                              aria-label={`Select ${userLabel}`}
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
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
                          {String(r.status ?? "") === "success" ||
                          String(r.status ?? "") === "sent" ? (
                            <Badge variant="white">Sent</Badge>
                          ) : String(r.status ?? "") === "failed" ? (
                            <Badge variant="dark">Failed</Badge>
                          ) : String(r.status ?? "") === "skipped" ? (
                            <Badge variant="gray">Skipped</Badge>
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
                      <TableCell colSpan={8} className="text-muted-foreground py-10 text-center">
                        No notification logs found.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </>
              )}
            </TableBody>
          </Table>
          {selectedOnPage > 0 && pageSelectableUuids.size > 0 ? (
            <p className="text-muted-foreground mt-3 text-xs">
              {selectedOnPage} of {pageSelectableUuids.size} on this page · {selectedUserUuids.size}{" "}
              user(s) total selected
            </p>
          ) : null}
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

function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString();
}
