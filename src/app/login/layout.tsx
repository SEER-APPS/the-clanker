import { Suspense } from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Suspense fallback={<main className="flex min-h-svh items-center justify-center">Loading…</main>}>
      {children}
    </Suspense>
  );
}
