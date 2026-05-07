"use client";

import { useGetSettingsQuery, useUpdateProfileMutation, useUpdatePasswordMutation, useUpdatePhotoMutation, useRemovePhotoMutation } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

  useEffect(() => {
    if (admin) {
      setName(admin.name);
      setEmail(admin.email);
    }
  }, [admin]);

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

  if (isLoading || !admin) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Profile, password, and photo.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-md gap-3"
            onSubmit={(e) => {
              void onProfile(e);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="set-name">Name</Label>
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
              <Label htmlFor="set-email">Email</Label>
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
            <Button
              type="submit"
              disabled={pBusy}
            >
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
        </CardHeader>
        <CardContent>
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
            <Button
              type="submit"
              disabled={pwBusy}
            >
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {admin.profile_photo ? (
            <p className="text-muted-foreground text-sm">
              Current:{" "}
              <a
                href={admin.profile_photo}
                className="text-primary underline"
                target="_blank"
                rel="noreferrer"
              >
                View
              </a>
            </p>
          ) : null}
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              void onPhoto(e);
            }}
          >
            <Input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            />
            <Button
              type="submit"
              disabled={phBusy}
            >
              Upload photo
            </Button>
          </form>
          <Button
            type="button"
            variant="outline"
            disabled={rmBusy}
            onClick={() => {
              void onRemovePhoto();
            }}
          >
            Remove photo
          </Button>
        </CardContent>
      </Card>
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
