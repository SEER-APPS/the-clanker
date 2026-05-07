"use client";

import { use } from "react";
import Link from "next/link";
import { useGetConversationQuery } from "@/store/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  const { id: raw } = use(params);
  const id = Number(raw);
  const { data, isLoading, isError } = useGetConversationQuery(id, { skip: !Number.isFinite(id) });

  if (!Number.isFinite(id)) {
    return <p className="text-destructive text-sm">Invalid id.</p>;
  }
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }
  if (isError || !data?.conversation) {
    return <p className="text-destructive text-sm">Conversation not found.</p>;
  }

  const conv = data.conversation as Record<string, unknown>;

  return (
    <article className="space-y-6">
      <header>
        <Link
          href="/conversations"
          className="text-muted-foreground text-sm hover:underline"
        >
          Back to conversations
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Conversation #{String(conv.id)}
        </h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payload</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted max-h-[520px] overflow-auto rounded-md p-3 font-mono text-xs">
            {JSON.stringify(conv, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </article>
  );
}
