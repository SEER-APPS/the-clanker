import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center p-6">
          <div className="flex w-full max-w-sm flex-col gap-3" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        </main>
      }
    >
      {children}
    </Suspense>
  );
}
