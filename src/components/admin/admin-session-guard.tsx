"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useGetMeQuery } from "@/store/admin-api";

async function clearAdminSession(reason: string): Promise<void> {
  try {
    await fetch("/api/admin/auth/logout", { method: "POST", credentials: "same-origin" });
  } catch {
    // Still redirect — cookie may be cleared client-side on next navigation.
  }
  toast.message(reason);
  window.location.assign("/login");
}

/**
 * Validates the server session via `/auth/me`. Idle timeout is enforced server-side
 * (`SESSION_ADMIN_IDLE_MINUTES` on core); this handles absolute expiry and 401 responses.
 */
export function AdminSessionGuard(): React.ReactElement | null {
  const { data, error } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) {
      return;
    }
    const expiresAt = data?.session_expires_at;
    if (!expiresAt) {
      return;
    }
    const expiryMs = Date.parse(expiresAt);
    if (Number.isNaN(expiryMs)) {
      return;
    }
    if (Date.now() >= expiryMs) {
      handledRef.current = true;
      void clearAdminSession("Your admin session expired. Please sign in again.");
    }
  }, [data?.session_expires_at]);

  useEffect(() => {
    if (handledRef.current) {
      return;
    }
    if (error && "status" in error && error.status === 401) {
      handledRef.current = true;
      const apiMessage =
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "message" in error.data &&
        typeof (error.data as { message?: unknown }).message === "string"
          ? (error.data as { message: string }).message
          : undefined;
      const message = apiMessage?.includes("inactivity")
        ? "Signed out after inactivity."
        : "Your admin session expired. Please sign in again.";
      void clearAdminSession(message);
    }
  }, [error]);

  return null;
}
