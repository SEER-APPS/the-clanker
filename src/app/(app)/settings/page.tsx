"use client";

import { useGetSettingsQuery, useUpdateProfileMutation, useUpdatePasswordMutation, useUpdatePhotoMutation, useRemovePhotoMutation } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminSettingsPageSkeleton } from "@/components/admin/admin-loading-skeletons";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SettingsPage(): React.ReactElement {
  const { data, isLoading, refetch } = useGetSettingsQuery();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [updateProfile, { isLoading: pBusy }] = useUpdateProfileMutation();
  const [updatePassword, { isLoading: pwBusy }] = useUpdatePasswordMutation();
  const [updatePhoto, { isLoading: phBusy }] = useUpdatePhotoMutation();
  const [removePhoto, { isLoading: rmBusy }] = useRemovePhotoMutation();

  const admin = data?.admin;
  const router = useRouter();
  const [sessionBusy, setSessionBusy] = useState(false);

  type SettingsTabId = "profile" | "photo" | "password" | "account";
  const TABS: Array<{ id: SettingsTabId; label: string; description: string }> = [
    { id: "profile", label: "Profile", description: "Update your name and email." },
    { id: "photo", label: "Photo", description: "Profile picture and upload." },
    { id: "password", label: "Password", description: "Change your password." },
    { id: "account", label: "Account Info", description: "Account details and session." },
  ];

  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  useEffect(() => {
    if (admin) {
      setName(admin.name);
      setEmail(admin.email);
    }
  }, [admin]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (hash === "profile" || hash === "photo" || hash === "password" || hash === "account") {
      setActiveTab(hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== `#${activeTab}`) {
      window.history.replaceState(null, "", `#${activeTab}`);
    }
  }, [activeTab]);

  async function onProfile(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    try {
      await updateProfile({ name, email }).unwrap();
      toast.success("Profile saved.");
      void refetch();
    } catch (err: unknown) {
      toast.error(msg(err));
    }
  }

  async function onPassword(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    try {
      await updatePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      }).unwrap();
      toast.success("Password updated.");
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err: unknown) {
      toast.error(msg(err));
    }
  }

  async function onPhoto(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("photo") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      toast.error("Choose an image.");
      return;
    }
    const fd = new FormData();
    fd.append("photo", file);
    try {
      await updatePhoto(fd).unwrap();
      toast.success("Photo updated.");
      void refetch();
      input.value = "";
    } catch (err: unknown) {
      toast.error(msg(err));
    }
  }

  async function onRemovePhoto(): Promise<void> {
    try {
      await removePhoto().unwrap();
      toast.success("Photo removed.");
      void refetch();
    } catch (err: unknown) {
      toast.error(msg(err));
    }
  }

  async function signOutEverywhere(): Promise<void> {
    try {
      setSessionBusy(true);
      const res = await fetch("/api/admin/auth/logout", { method: "POST" });
      if (!res.ok) {
        toast.error("Sign out failed.");
        return;
      }
      toast.success("Signed out.");
      router.replace("/login");
    } catch {
      toast.error("Sign out failed.");
    } finally {
      setSessionBusy(false);
    }
  }

  if (isLoading || !admin) {
    return <AdminSettingsPageSkeleton />;
  }

  return (
    <article className="space-y-6">
      <AdminPageHeader title="Settings" subtitle="Manage your account and preferences." />

      <section className="grid gap-6 md:grid-cols-[220px_1fr] md:items-start">
        <aside className={mobileDetailOpen ? "hidden md:block" : "block"}>
          <nav aria-label="Settings">
            <ul className="flex flex-col gap-1">
              {TABS.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={[
                      "w-full text-left px-3 py-2 text-sm transition-colors border-l-2",
                      t.id === activeTab
                        ? "text-foreground font-semibold border-l-foreground"
                        : "text-muted-foreground border-l-transparent hover:text-foreground hover:border-l-muted-foreground",
                    ].join(" ")}
                    onClick={() => {
                      setActiveTab(t.id);
                      setMobileDetailOpen(true);
                    }}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className={mobileDetailOpen ? "block" : "hidden md:block"}>
          <header className="mb-4 flex items-center justify-between gap-3 md:hidden">
            <div>
              <h2 className="text-lg font-semibold">{TABS.find((t) => t.id === activeTab)?.label}</h2>
              <p className="text-muted-foreground text-sm">
                {TABS.find((t) => t.id === activeTab)?.description}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMobileDetailOpen(false);
              }}
            >
              Back
            </Button>
          </header>

          {activeTab === "profile" ? (
            <Card className="rounded-none">
              <CardHeader className="border-b py-3">
                <CardTitle className="admin-card-title">Profile</CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <form
                  className="grid max-w-xl gap-3 md:grid-cols-2"
                  onSubmit={(e) => {
                    void onProfile(e);
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="set-name">Full name</Label>
                    <Input
                      id="set-name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="set-email">Email address</Label>
                    <Input
                      id="set-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={pBusy} aria-busy={pBusy}>
                      {pBusy ? (
                        <>
                          <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden="true" />
                          Saving…
                        </>
                      ) : (
                        "Save Profile"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "photo" ? (
            <Card className="rounded-none">
              <CardHeader className="border-b py-3">
                <CardTitle className="admin-card-title">Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 py-4">
                <div className="flex flex-wrap items-center gap-4">
                  {admin.profile_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={admin.profile_photo}
                      alt={admin.name}
                      className="h-[72px] w-[72px] border border-border object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-[72px] w-[72px] items-center justify-center border border-border text-2xl font-bold text-muted-foreground">
                      {String(admin.name ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-[220px] space-y-1">
                    <div className="text-sm font-medium">{admin.name}</div>
                    <div className="text-muted-foreground text-xs">
                      JPG, PNG or WebP · max 2 MB
                    </div>
                    {admin.profile_photo ? (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={rmBusy}
                        aria-busy={rmBusy}
                        onClick={() => {
                          void onRemovePhoto();
                        }}
                      >
                        {rmBusy ? (
                          <>
                            <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden="true" />
                            Removing…
                          </>
                        ) : (
                          "Remove photo"
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <Separator />

                <form
                  className="flex flex-col gap-3"
                  onSubmit={(e) => {
                    void onPhoto(e);
                  }}
                >
                  <Input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
                  <div>
                    <Button type="submit" disabled={phBusy} aria-busy={phBusy}>
                      {phBusy ? (
                        <>
                          <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden="true" />
                          Uploading…
                        </>
                      ) : (
                        "Upload Photo"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "password" ? (
            <Card className="rounded-none">
              <CardHeader className="border-b py-3">
                <CardTitle className="admin-card-title">Change Password</CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <form
                  className="grid max-w-md gap-3"
                  onSubmit={(e) => {
                    void onPassword(e);
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="set-cur">Current password</Label>
                    <Input
                      id="set-cur"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="set-pw">New password</Label>
                    <Input
                      id="set-pw"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="set-pw2">Confirm new password</Label>
                    <Input
                      id="set-pw2"
                      type="password"
                      value={passwordConfirmation}
                      onChange={(e) => {
                        setPasswordConfirmation(e.target.value);
                      }}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={pwBusy} aria-busy={pwBusy}>
                    {pwBusy ? (
                      <>
                        <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden="true" />
                        Updating…
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "account" ? (
            <section className="space-y-4">
              <Card className="rounded-none">
                <CardHeader className="border-b py-3">
                  <CardTitle className="admin-card-title">Account Info</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      <Row label="Admin ID" value={`#${admin.id}`} mono />
                      <Row label="UUID" value={admin.uuid} mono />
                      <Row label="Name" value={admin.name} />
                      <Row label="Email" value={admin.email} mono />
                      <Row label="Role" value={admin.is_super_admin ? "Super Admin" : "Admin"} />
                      <Row label="Last Login" value={admin.last_login_at ?? "—"} mono />
                      <Row
                        label="Member Since"
                        value={String((admin as unknown as { created_at?: string | null }).created_at ?? "—")}
                        mono
                      />
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardHeader className="border-b py-3">
                  <CardTitle className="admin-card-title">Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 py-4">
                  <p className="text-muted-foreground text-sm">
                    Sign out of all active sessions on all devices.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={sessionBusy}
                    aria-busy={sessionBusy}
                    onClick={() => {
                      void signOutEverywhere();
                    }}
                  >
                    {sessionBusy ? (
                      <>
                        <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden="true" />
                        Signing out…
                      </>
                    ) : (
                      "Sign Out Everywhere"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </section>
          ) : null}
        </main>
      </section>
    </article>
  );
}

function msg(err: unknown): string {
  if (err && typeof err === "object" && "data" in err) {
    const d = (err as { data?: { message?: string } }).data?.message;
    if (d) {
      return d;
    }
  }
  return "Something went wrong.";
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}): React.ReactElement {
  return (
    <TableRow>
      <TableCell className="text-muted-foreground w-40 text-[10px] font-semibold uppercase tracking-widest">
        {label}
      </TableCell>
      <TableCell className={mono ? "font-mono text-sm" : "text-sm"}>{value}</TableCell>
    </TableRow>
  );
}
