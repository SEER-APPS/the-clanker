import type { NextRequest } from "next/server";

const HOP_BY_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "keep-alive",
]);

/**
 * Proxies public Laravel `/api/services/*` routes through Next so the browser never
 * needs `NEXT_PUBLIC_*` or a literal API origin (fixes SSR vs client hydration).
 */
export async function proxyLaravelPublicServices(
  req: NextRequest,
  pathSegments: string[],
  method: string,
): Promise<Response> {
  const base = process.env.SEER_BACKEND_URL?.replace(/\/+$/, "");
  if (!base) {
    return Response.json(
      {
        success: false,
        message: "Service temporarily unavailable.",
      },
      { status: 503 },
    );
  }

  const suffix = pathSegments.length > 0 ? pathSegments.join("/") : "";
  const targetPath = suffix ? `/api/${suffix}` : `/api`;
  const url = new URL(targetPath, base);
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_REQUEST_HEADERS.has(lower) || lower === "cookie") {
      return;
    }
    headers.set(key, value);
  });
  headers.set("Accept", "application/json");
  headers.set("X-Seer-Admin-Origin", req.nextUrl.origin);
  if (!headers.has("content-type") && method === "POST") {
    headers.set("Content-Type", "application/json");
  }

  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(method) && req.body) {
    init.body = req.body;
    init.duplex = "half";
  }

  return fetch(url.toString(), init);
}
