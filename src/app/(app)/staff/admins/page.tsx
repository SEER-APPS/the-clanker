"use client";

import { useGetMeQuery, useGetStaffAdminsQuery, useCreateStaffAdminMutation, useChangeStaffRoleMutation, useDeleteStaffAdminMutation } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { formatAdminMutationError } from "@/lib/admin-api-envelope";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminConfirm } from "@/hooks/use-admin-confirm";
import { AdminTableBodySkeleton } from "@/components/admin/admin-loading-skeletons";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 as LoaderSpin } from "lucide-react";

export default function StaffAdminsPage(): React.ReactElement {
  const { data: me } = useGetMeQuery();
  const { data, isLoading, isError, refetch } = useGetStaffAdminsQuery(undefined, {
    skip: !me?.admin.is_super_admin,
  });
  const [create, { isLoading: cBusy }] = useCreateStaffAdminMutation();
  const [changeRole] = useChangeStaffRoleMutation();
  const [remove] = useDeleteStaffAdminMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [open, setOpen] = useState(false);
  const [rolePendingId, setRolePendingId] = useState<number | null>(null);
  const [removePendingId, setRemovePendingId] = useState<number | null>(null);
  const { confirm, dialog: confirmDialog } = useAdminConfirm();

  if (!me?.admin.is_super_admin) {
    return (
      <p className="text-destructive text-sm">
        Only super admins can manage staff accounts.
      </p>
    );
  }

  const admins = (data?.admins ?? []) as Record<string, unknown>[];

  async function onCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    try {
      await create({ name, email, password, password_confirmation: passwordConfirmation }).unwrap();
      toast.success("Admin created.");
      setName("");
      setEmail("");
      setPassword("");
      setPasswordConfirmation("");
      void refetch();
    } catch (err: unknown) {
      toast.error(formatAdminMutationError(err));
    }
  }

  return (
    <article className="space-y-6">
      {confirmDialog}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <AdminPageHeader
          title="Admin Accounts"
          subtitle={`${admins.length} account${admins.length === 1 ? "" : "s"} · only super admins can manage this section`}
        />

        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) {
              setName("");
              setEmail("");
              setPassword("");
              setPasswordConfirmation("");
            }
          }}
        >
          <DialogTrigger
            render={
              <Button type="button">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Admin
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Admin</DialogTitle>
            </DialogHeader>

            <p className="text-muted-foreground text-sm">
              New admins can access all sections except admin account management.
            </p>

            <form
              className="grid gap-3"
              onSubmit={(e) => {
                void (async () => {
                  await onCreate(e);
                  setOpen(false);
                })();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="sa-name">Full name</Label>
                <Input
                  id="sa-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  required
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sa-email">Email address</Label>
                <Input
                  id="sa-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  required
                  placeholder="e.g. jane@theseer.app"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sa-pw">Password</Label>
                <Input
                  id="sa-pw"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  required
                  placeholder="Min. 8 characters with letters and numbers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sa-pw2">Confirm password</Label>
                <Input
                  id="sa-pw2"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => {
                    setPasswordConfirmation(e.target.value);
                  }}
                  required
                  placeholder="Re-enter password"
                />
              </div>

              <div className="bg-muted rounded-md border p-3 text-sm">
                <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest">
                  Permissions
                </div>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  This admin will have <span className="text-foreground font-semibold">read access</span>{" "}
                  to users, threat alerts, app support, and notification logs. They{" "}
                  <span className="text-foreground font-semibold">cannot</span> manage other admin
                  accounts or perform destructive actions reserved for super admins.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit" disabled={cBusy} aria-busy={cBusy}>
                  {cBusy ? (
                    <>
                      <LoaderSpin className="mr-2 inline size-4 animate-spin" aria-hidden="true" />
                      Creating…
                    </>
                  ) : (
                    "Create Admin Account"
                  )}
                </Button>
                <DialogClose
                  render={
                    <Button type="button" variant="ghost" disabled={cBusy} />
                  }
                >
                  Cancel
                </DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isError ? (
        <p className="text-destructive text-sm">Could not load admins.</p>
      ) : null}

      <Card className="rounded-none">
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <AdminTableBodySkeleton
                  rows={6}
                  cellWidths={["w-10", "w-32", "w-36", "w-20", "w-24", "w-24", "w-16"]}
                />
              ) : (
                <>
                  {admins.map((a) => {
                  const id = Number(a.id);
                  const isSuper = Boolean(a.is_super_admin);
                  const isSelf = id === Number(me?.admin.id);
                  const profilePhoto = String(a.profile_photo ?? "");
                  const initial = String(a.name ?? "?").slice(0, 1).toUpperCase();
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {profilePhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={profilePhoto}
                              alt={String(a.name ?? "Admin")}
                              className="h-7 w-7 shrink-0 border border-border object-cover"
                            />
                          ) : (
                            <div
                              className={[
                                "flex h-7 w-7 shrink-0 items-center justify-center border border-border text-[11px] font-bold",
                                isSuper ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                              ].join(" ")}
                            >
                              {initial}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {String(a.name ?? "—")}
                              {isSelf ? (
                                <span className="text-muted-foreground ml-2 text-[11px]">(you)</span>
                              ) : null}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {String(a.email ?? "—")}
                      </TableCell>
                      <TableCell>
                        {isSuper ? <Badge variant="dark">Super Admin</Badge> : <Badge variant="gray">Admin</Badge>}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {String(a.last_login_at ?? "Never")}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {String(a.created_at ?? "—")}
                      </TableCell>
                      <TableCell>
                        {isSelf ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={rolePendingId !== null || removePendingId !== null}
                              aria-busy={rolePendingId === id}
                              onClick={() => {
                                void (async () => {
                                  setRolePendingId(id);
                                  try {
                                    await changeRole(id).unwrap();
                                    toast.success(isSuper ? "Demoted." : "Promoted.");
                                    void refetch();
                                  } catch (err) {
                                    toast.error(formatAdminMutationError(err));
                                  } finally {
                                    setRolePendingId(null);
                                  }
                                })();
                              }}
                            >
                              {rolePendingId === id ? (
                                <>
                                  <LoaderSpin
                                    className="mr-2 size-4 animate-spin"
                                    aria-hidden="true"
                                  />
                                  …
                                </>
                              ) : isSuper ? (
                                "Demote"
                              ) : (
                                "Promote"
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={
                                removePendingId !== null ||
                                rolePendingId !== null ||
                                isSuper
                              }
                              aria-busy={removePendingId === id}
                              onClick={() => {
                                void (async () => {
                                  const adminName = String(a.name ?? "this admin");
                                  const confirmed = await confirm({
                                    title: "Remove admin access?",
                                    description: `Remove ${adminName}'s admin access? They will no longer be able to sign in to the admin dashboard.`,
                                    confirmLabel: "Remove access",
                                    destructive: true,
                                  });
                                  if (!confirmed) {
                                    return;
                                  }
                                  setRemovePendingId(id);
                                  try {
                                    await remove(id).unwrap();
                                    toast.success("Removed.");
                                    void refetch();
                                  } catch (err) {
                                    toast.error(formatAdminMutationError(err));
                                  } finally {
                                    setRemovePendingId(null);
                                  }
                                })();
                              }}
                            >
                              {removePendingId === id ? (
                                <>
                                  <LoaderSpin
                                    className="mr-2 size-4 animate-spin"
                                    aria-hidden="true"
                                  />
                                  …
                                </>
                              ) : (
                                "Remove"
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                  {!admins.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                        No admin accounts yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </article>
  );
}
