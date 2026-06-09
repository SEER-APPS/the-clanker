import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { ADMIN_TOKEN_COOKIE } from "@/lib/admin-cookie";

const SKIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "keep-alive",
]);

/** Upstream may gzip; Node fetch decompresses the body but can leave Content-Encoding set. */
const SKIP_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
]);

export async function proxyToLaravel(
  req: NextRequest,
  pathSegments: string[],
  method: string,
): Promise<Response> {
  const base = process.env.SEER_BACKEND_URL?.replace(/\/+$/, "");
  if (!base) {
    return Response.json(
      { success: false, message: "SEER_BACKEND_URL is not configured." },
      { status: 503 },
    );
  }

  const suffix = pathSegments.length > 0 ? pathSegments.join("/") : "";
  const targetPath = suffix ? `/api/admin/v1/${suffix}` : `/api/admin/v1`;
  const url = new URL(targetPath, base);
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const token = (await cookies()).get(ADMIN_TOKEN_COOKIE)?.value;
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!SKIP_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  headers.set("Accept", "application/json");
  headers.set("Accept-Encoding", "identity");
  const mobileKey = process.env.MOBILE_API_KEY;
  if (mobileKey) {
    headers.set("X-Seer-Client-Key", mobileKey);
  }
  const adminApiSecret = process.env.ADMIN_API_SECRET;
  if (adminApiSecret) {
    headers.set("X-Seer-Admin-Key", adminApiSecret);
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("X-Seer-Admin-Origin", req.nextUrl.origin);

  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(method) && req.body) {
    init.body = req.body;
    init.duplex = "half";
  }

  let upstream: Response;
  try {
    upstream = await fetch(url.toString(), init);
  } catch (error) {
    console.error("[admin/proxy] upstream fetch failed", {
      target: url.toString(),
      error,
    });
    return Response.json(
      {
        success: false,
        message:
          "Could not reach the API. Verify SEER_BACKEND_URL on the admin host points at your seer-proxy URL.",
      },
      { status: 503 },
    );
  }

  const body = await upstream.arrayBuffer();
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
