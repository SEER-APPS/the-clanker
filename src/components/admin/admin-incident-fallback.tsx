"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminIncidentFallbackProps = {
  title: string;
  description: string;
  onRetry?: () => void;
};

export function AdminIncidentFallback({
  title,
  description,
  onRetry,
}: AdminIncidentFallbackProps): React.ReactElement {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <Button type="button" variant="default" onClick={() => onRetry()}>
            Try again
          </Button>
        ) : null}
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: onRetry ? "outline" : "default" }))}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
