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

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return {
      error: {
        status: response.status || 500,
        data: { success: false, message: "Invalid JSON from server." },
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
