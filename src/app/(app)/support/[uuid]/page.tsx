"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useGetSupportMessagesQuery,
  useSendSupportReplyMutation,
} from "@/store/admin-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

type SupportMessage = {
  uuid: string;
  content: string;
  is_mine: boolean;
  sender?: { name?: string };
  created_at?: string;
};

export default function SupportConversationPage(): React.ReactElement {
  const params = useParams<{ uuid: string }>();
  const uuid = params.uuid;
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isError, refetch } = useGetSupportMessagesQuery(
    { uuid },
    { pollingInterval: 5000 },
  );
  const [sendReply, { isLoading: sending }] = useSendSupportReplyMutation();

  const messages = (data?.messages ?? []) as SupportMessage[];
  const customer = data?.customer as Record<string, unknown> | undefined;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) {
      return;
    }
    await sendReply({ uuid, content }).unwrap();
    setDraft("");
    await refetch();
  }

  return (
    <article className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <Link href="/support" className="text-muted-foreground text-sm hover:underline">
            ← Back to App Support
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {String(customer?.name ?? "Customer")}
          </h1>
          <p className="text-muted-foreground text-sm">{String(customer?.phone ?? "—")}</p>
        </div>
      </header>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 pt-6">
          {isLoading ? (
            <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading messages…
            </div>
          ) : null}
          {isError ? (
            <p className="text-destructive text-sm">Could not load this support conversation.</p>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.uuid}
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  message.is_mine
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted text-foreground mr-auto"
                }`}
              >
                <div>{message.content}</div>
                <div className="mt-1 text-[10px] opacity-70">
                  {message.is_mine ? "Support" : String(message.sender?.name ?? "Customer")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t pt-4">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Reply as Support…"
              disabled={sending}
            />
            <Button type="submit" disabled={sending || draft.trim().length === 0}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </article>
  );
}
