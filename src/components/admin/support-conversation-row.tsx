"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, ReactNode } from "react";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SupportConversationRowProps = {
  conversationUuid: string;
  className?: string;
  children: ReactNode;
};

export function SupportConversationRow({
  conversationUuid,
  className,
  children,
}: SupportConversationRowProps): React.ReactElement {
  const router = useRouter();
  const href = `/support/${conversationUuid}`;

  function openConversation(): void {
    router.push(href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openConversation();
    }
  }

  return (
    <TableRow
      className={cn("hover:bg-muted/30 cursor-pointer", className)}
      onClick={openConversation}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="link"
      aria-label={`Open support conversation ${conversationUuid}`}
    >
      {children}
    </TableRow>
  );
}

export function readSupportMessageContent(message: Record<string, unknown>): string {
  const raw = message.content ?? message.body;
  return typeof raw === "string" ? raw.trim() : "";
}
