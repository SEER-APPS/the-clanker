"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useGetSupportMessagesQuery,
  useSendSupportReplyMutation,
} from "@/store/admin-api";
import { readSupportMessageContent } from "@/components/admin/support-conversation-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Loader2 } from "lucide-react";

function formatMessageTime(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SupportConversationPage(): React.ReactElement {
  const params = useParams<{ uuid: string }>();
  const uuid = params.uuid;
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useGetSupportMessagesQuery(
    { uuid },
    { pollingInterval: 5000 },
  );
  const [sendReply, { isLoading: sending }] = useSendSupportReplyMutation();

  const rawMessages = data?.messages;
  const messages = Array.isArray(rawMessages)
    ? rawMessages.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    : [];
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
    <article className="flex min-h-[calc(100vh-8rem)] flex-col gap-4">
      <header className="space-y-3">
        <Link
          href="/support"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {String(customer?.name ?? "Customer")}
          </h1>
          <p className="text-muted-foreground text-sm">{String(customer?.phone ?? "—")}</p>
        </div>
      </header>

      <Card className="flex min-h-0 flex-1 flex-col rounded-none">
        <CardContent className="flex min-h-[420px] flex-1 flex-col gap-0 p-0">
          <div className="relative min-h-0 flex-1">
            {isLoading ? (
              <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading messages…
              </div>
            ) : null}

            {isError ? (
              <div className="p-5">
                <p className="text-destructive text-sm">Could not load this support conversation.</p>
              </div>
            ) : null}

            {!isLoading && !isError ? (
              <div className="flex h-full min-h-[320px] flex-col gap-3 overflow-y-auto px-5 py-5">
                {messages.length === 0 ? (
                  <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
                    No messages in this thread yet.
                  </div>
                ) : (
                  messages.map((message) => {
                    const content = readSupportMessageContent(message);
                    const isMine = message.is_mine === true;
                    const sender = message.sender as Record<string, unknown> | undefined;
                    const label = isMine
                      ? "Support"
                      : String(sender?.name ?? sender?.display_name ?? "Customer");

                    return (
                      <div
                        key={String(message.uuid ?? content)}
                        className={`max-w-[min(75%,520px)] rounded-lg px-3 py-2 text-sm ${
                          isMine
                            ? "bg-foreground text-background ml-auto"
                            : "bg-muted text-foreground mr-auto"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{content || "—"}</p>
                        <div className="mt-1 flex items-center justify-between gap-3 text-[10px] opacity-70">
                          <span>{label}</span>
                          <span>{formatMessageTime(message.created_at)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>
            ) : null}

            {isFetching && !isLoading ? (
              <div className="text-muted-foreground pointer-events-none absolute top-3 right-3 text-[11px]">
                Updating…
              </div>
            ) : null}
          </div>

          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t px-5 py-4"
          >
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Reply as Support…"
              disabled={sending || isLoading}
            />
            <Button type="submit" disabled={sending || isLoading || draft.trim().length === 0}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </article>
  );
}
