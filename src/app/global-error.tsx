"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error("admin global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 flex min-h-screen flex-col items-center justify-center gap-4 px-6 antialiased">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-zinc-400 max-w-md text-center text-sm">
          The admin shell hit a critical error. Try reloading the page.
        </p>
        <button
          type="button"
          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-md px-4 py-2 text-sm font-medium"
          onClick={() => reset()}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
