"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type StreamLine = {
  cursor: number;
  text: string;
};

function parseCursor(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function LogTailStream({
  className,
  maxLines = 600,
}: {
  className?: string;
  maxLines?: number;
}): React.ReactElement {
  const [lines, setLines] = useState<StreamLine[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "closed" | "error">("connecting");
  const cursorRef = useRef<number | null>(null);

  const url = useMemo(() => {
    const base = "/api/admin/v1/services/analytics/logs/stream";
    const cursor = cursorRef.current;
    return cursor ? `${base}?cursor=${encodeURIComponent(String(cursor))}` : base;
  }, []);

  useEffect(() => {
    setStatus("connecting");

    const source = new EventSource(url);

    source.addEventListener("ping", (ev) => {
      const data = (ev as MessageEvent).data as string;
      const cursor = parseCursor(data);
      if (cursor !== null) cursorRef.current = cursor;
      setStatus("live");
    });

    source.addEventListener("line", (ev) => {
      const msg = ev as MessageEvent;
      const cursor = parseCursor(msg.lastEventId) ?? cursorRef.current ?? 0;
      cursorRef.current = cursor;
      setStatus("live");
      setLines((prev) => {
        const next = prev.concat({ cursor, text: String(msg.data ?? "") });
        return next.length > maxLines ? next.slice(next.length - maxLines) : next;
      });
    });

    source.addEventListener("end", () => {
      setStatus("closed");
      source.close();
    });

    source.onerror = () => {
      setStatus("error");
    };

    return () => {
      source.close();
      setStatus("closed");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={className}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-muted-foreground text-[11px]">
          Live tail:{" "}
          <span className="font-medium text-foreground">
            {status === "connecting"
              ? "connecting"
              : status === "live"
                ? "live"
                : status === "closed"
                  ? "closed"
                  : "error"}
          </span>
        </div>
        <div className="text-muted-foreground text-[11px] tabular-nums">
          Lines: <span className="text-foreground">{lines.length}</span>
        </div>
      </div>

      <pre className="bg-muted max-h-[480px] overflow-y-auto overflow-x-hidden rounded-md p-3 font-mono text-xs whitespace-pre-wrap wrap-break-word">
        {lines.map((l) => l.text).join("\n")}
      </pre>
    </section>
  );
}

