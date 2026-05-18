"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 25, 50, 100],
}: {
  meta: PaginationMeta | undefined;
  className?: string;
  page: number;
  perPage?: number;
  onPageChange: (nextPage: number) => void;
  onPerPageChange?: (nextPerPage: number) => void;
  perPageOptions?: number[];
}): React.ReactElement | null {
  if (!meta) {
    return null;
  }

  const showPager = meta.last_page > 1 || meta.total > 0;
  const showPerPage = Boolean(onPerPageChange);

  if (!showPager && !showPerPage) {
    return null;
  }

  const resolvedPerPage = perPage ?? meta.per_page;

  function applyPerPage(raw: string): void {
    if (!onPerPageChange) {
      return;
    }
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) {
      return;
    }
    onPerPageChange(Math.min(100, Math.max(1, n)));
  }

  return (
    <nav
      className={className}
      aria-label="Pagination"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {showPager ? (
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
        ) : (
          <span className="text-muted-foreground text-sm tabular-nums">{meta.total} total</span>
        )}

        {showPerPage ? (
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="admin-per-page" className="text-xs">
                Rows per page
              </Label>
              <Input
                id="admin-per-page"
                className="h-8 w-20"
                inputMode="numeric"
                min={1}
                max={100}
                value={String(resolvedPerPage)}
                onChange={(e) => {
                  applyPerPage(e.target.value);
                }}
                onBlur={(e) => {
                  applyPerPage(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-wrap gap-1 pb-0.5">
              {perPageOptions.map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={resolvedPerPage === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onPerPageChange?.(n);
                  }}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
