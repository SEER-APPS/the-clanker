"use client";

import { use } from "react";
import Link from "next/link";
import {
  useGetUserQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useDeleteUserMutation,
} from "@/store/admin-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}): React.ReactElement {
  const { uuid } = use(params);

  const { data, isLoading, isError, refetch } = useGetUserQuery(uuid, {
    skip: !uuid,
  });
  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const user = data?.user as Record<string, unknown> | undefined;
  const blocked = Boolean(user?.is_blocked);

  async function run(action: "block" | "unblock" | "delete"): Promise<void> {
    if (action === "delete" && !window.confirm("Delete this user permanently?")) {
      return;
    }
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
        window.location.href = "/users";
        return;
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

  if (!uuid) {
    return <p className="text-destructive text-sm">Invalid user.</p>;
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (isError || !user) {
    return <p className="text-destructive text-sm">User not found.</p>;
  }

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/users" className="text-muted-foreground text-sm hover:underline">
            Back to users
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {String(user.name ?? "User")}
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {String(user.phone_number ?? "")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {blocked ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void run("unblock");
              }}
            >
              Unblock
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void run("block");
              }}
            >
              Block
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              void run("delete");
            }}
          >
            Delete
          </Button>
        </div>
      </header>

      <Card className="rounded-none">
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="UUID" value={String(user.uuid ?? "—")} />
          <Row label="Blocked" value={blocked ? "Yes" : "No"} />
          <Row label="Messages" value={String(user.messages_count ?? "—")} />
          <Row label="Conversations" value={String(user.conversations_count ?? "—")} />
          <Row label="Threat alerts" value={String(user.threat_alerts_count ?? "—")} />
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader className="border-b py-3">
          <CardTitle className="admin-card-title">Recent sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 font-mono text-xs">
            {JSON.stringify(user.device_sessions ?? [], null, 2)}
          </pre>
        </CardContent>
      </Card>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <span className="text-muted-foreground min-w-32">{label}</span>
        <span>{value}</span>
      </div>
      <Separator />
    </>
  );
}

