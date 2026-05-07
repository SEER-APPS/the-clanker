"use client";

import { Button } from "@/components/ui/button";

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export function PaginationControls({
  meta,
  className,
  page,
  onPageChange,
}: {
  meta: PaginationMeta | undefined;
  className?: string;
  page: number;
  onPageChange: (nextPage: number) => void;
}): React.ReactElement | null {
  if (!meta || meta.last_page <= 1) {
    return null;
  }

  return (
    <nav
      className={className}
      aria-label="Pagination"
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => {
            onPageChange(page - 1);
          }}
        >
          Previous
        </Button>
        <span className="text-muted-foreground text-sm tabular-nums">
          Page {page} of {meta.last_page} ({meta.total} total)
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= meta.last_page}
          onClick={() => {
            onPageChange(page + 1);
          }}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
