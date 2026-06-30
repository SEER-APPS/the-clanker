"use client";

import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type AdminConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PendingConfirm = AdminConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

export function useAdminConfirm(): {
  confirm: (options: AdminConfirmOptions) => Promise<boolean>;
  dialog: React.ReactElement | null;
} {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);
  pendingRef.current = pending;

  const confirm = useCallback((options: AdminConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const close = useCallback((confirmed: boolean) => {
    const current = pendingRef.current;
    if (!current) {
      return;
    }
    current.resolve(confirmed);
    setPending(null);
  }, []);

  const dialog =
    pending != null ? (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) {
            close(false);
          }
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pending.title}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {pending.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              {pending.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              type="button"
              variant={pending.destructive ? "destructive" : "default"}
              onClick={() => close(true)}
            >
              {pending.confirmLabel ?? "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ) : null;

  return { confirm, dialog };
}
