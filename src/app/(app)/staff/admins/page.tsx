"use client";

import { useGetMeQuery, useGetStaffAdminsQuery, useCreateStaffAdminMutation, useChangeStaffRoleMutation, useDeleteStaffAdminMutation } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function StaffAdminsPage(): React.ReactElement {
  const { data: me } = useGetMeQuery();
  const { data, isLoading, isError, refetch } = useGetStaffAdminsQuery(undefined, {
    skip: !me?.admin.is_super_admin,
  });
  const [create, { isLoading: cBusy }] = useCreateStaffAdminMutation();
  const [changeRole, { isLoading: rBusy }] = useChangeStaffRoleMutation();
  const [remove, { isLoading: dBusy }] = useDeleteStaffAdminMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

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
      toast.error(parseErr(err));
    }
  }

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Admin accounts</h1>
        <p className="text-muted-foreground mt-1 text-sm">Create and manage dashboard users.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-md gap-3"
            onSubmit={(e) => {
              void onCreate(e);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="sa-name">Name</Label>
              <Input
                id="sa-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-email">Email</Label>
              <Input
                id="sa-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                required
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-pw2">Confirm</Label>
              <Input
                id="sa-pw2"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => {
                  setPasswordConfirmation(e.target.value);
                }}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={cBusy}
            >
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      {isError ? (
        <p className="text-destructive text-sm">Could not load admins.</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Existing</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Super</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => {
                  const id = Number(a.id);
                  const isSuper = Boolean(a.is_super_admin);
                  return (
                    <TableRow key={id}>
                      <TableCell>{String(a.name)}</TableCell>
                      <TableCell>{String(a.email)}</TableCell>
                      <TableCell>{isSuper ? "yes" : "no"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={rBusy}
                            onClick={() => {
                              void (async () => {
                                try {
                                  await changeRole(id).unwrap();
                                  toast.success("Role updated.");
                                  void refetch();
                                } catch (err) {
                                  toast.error(parseErr(err));
                                }
                              })();
                            }}
                          >
                            Toggle role
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={dBusy || isSuper}
                            onClick={() => {
                              if (!window.confirm("Remove this admin?")) {
                                return;
                              }
                              void (async () => {
                                try {
                                  await remove(id).unwrap();
                                  toast.success("Removed.");
                                  void refetch();
                                } catch (err) {
                                  toast.error(parseErr(err));
                                }
                              })();
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
          )}
        </CardContent>
      </Card>
    </article>
  );
}

function parseErr(err: unknown): string {
  if (err && typeof err === "object" && "data" in err) {
    const m = (err as { data?: { message?: string } }).data?.message;
    if (m) {
      return m;
    }
  }
  return "Request failed.";
}
