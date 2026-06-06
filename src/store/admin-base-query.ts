import type { BaseQueryFn, FetchArgs } from "@reduxjs/toolkit/query";

const API_PREFIX = "/api/admin/v1";

type JsonEnvelope = {
  success?: boolean;
  data?: unknown;
  message?: string;
  errors?: unknown;
} & Record<string, unknown>;

export type AdminQueryError = {
  status: number;
  data: JsonEnvelope;
};

function stripSuccess(envelope: JsonEnvelope): Record<string, unknown> {
  const { success: _s, ...rest } = envelope;
  return rest;
}

export const adminJsonBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  AdminQueryError
> = async (args) => {
  const raw =
    typeof args === "string"
      ? ({ url: args, method: "GET" } as FetchArgs)
      : { ...args };

  let path = raw.url.startsWith("/") ? raw.url : `/${raw.url}`;
  const params = raw.params as Record<string, string | number | boolean | undefined> | undefined;
  if (params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        search.set(key, String(value));
      }
    }
    const qs = search.toString();
    if (qs) {
      path += (path.includes("?") ? "&" : "?") + qs;
    }
  }

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(raw.headers as HeadersInit | undefined),
  };

  if (typeof window !== "undefined" && window.location.origin) {
    (headers as Record<string, string>)["X-Seer-Admin-Origin"] = window.location.origin;
  }

  const init: RequestInit = {
    method: raw.method ?? "GET",
    credentials: "same-origin",
    headers,
  };

  if (raw.body !== undefined) {
    if (raw.body instanceof FormData) {
      init.body = raw.body;
    } else {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
      init.body = JSON.stringify(raw.body);
    }
  }

  const response = await fetch(`${API_PREFIX}${path}`, init);

  const rawText = await response.text();
  let json: unknown;
  if (rawText.trim().length === 0) {
    return {
      error: {
        status: response.status || 502,
        data: {
          success: false,
          message: `Server returned an empty response (HTTP ${response.status || 502}).`,
        },
      },
    };
  }

  try {
    json = JSON.parse(rawText) as unknown;
  } catch {
    const contentType = response.headers.get("content-type") ?? "";
    const preview = rawText.replace(/\s+/g, " ").trim().slice(0, 240);
    return {
      error: {
        status: response.status || 502,
        data: {
          success: false,
          message: preview
            ? `Server returned non-JSON (HTTP ${response.status}): ${preview}`
            : "Server returned a non-JSON response.",
          content_type: contentType,
        },
      },
    };
  }

  const envelope = json as JsonEnvelope;

  if (response.status === 401) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
    return { error: { status: 401, data: envelope } };
  }

  if (envelope.success === true) {
    if (envelope.data !== undefined) {
      return { data: envelope.data };
    }
    return { data: stripSuccess(envelope) };
  }

  if (envelope.success === false || !response.ok) {
    return {
      error: {
        status: response.status,
        data: envelope,
      },
    };
  }

  if (response.ok) {
    return { data: json };
  }

  return {
    error: {
      status: response.status,
      data: envelope,
    },
  };
};
