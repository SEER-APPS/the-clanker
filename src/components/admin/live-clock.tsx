"use client";

import { useEffect, useState } from "react";

function formatClock(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function LiveClock(): React.ReactElement {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <span
      suppressHydrationWarning
      className="font-mono text-[11px] text-muted-foreground tabular-nums"
    >
      {now ? formatClock(now) : "—"}
    </span>
  );
}

