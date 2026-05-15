import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_TOKEN_COOKIE } from "@/lib/admin-cookie";
import { loginFailureMessageForClient } from "@/lib/login-failure-message";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const base = process.env.SEER_BACKEND_URL?.replace(/\/+$/, "");
  if (!base) {
    return NextResponse.json(
      { success: false, message: "Server misconfiguration." },
      { status: 503 },
    );
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json(
      { success: false, message: loginFailureMessageForClient(400) },
      { status: 400 },
    );
  }

  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });
  if (process.env.MOBILE_API_KEY) {
    headers.set("X-Seer-Client-Key", process.env.MOBILE_API_KEY);
  }
  if (process.env.ADMIN_API_SECRET) {
    headers.set("X-Seer-Admin-Key", process.env.ADMIN_API_SECRET);
  }

  let res: Response;
  try {
    res = await fetch(`${base}/api/admin/v1/auth/login`, {
      method: "POST",
      headers,
      body,
    });
  } catch (err) {
    console.error("[admin/auth/login] fetch to core failed", err);
    return NextResponse.json(
      { success: false, message: loginFailureMessageForClient(503) },
      { status: 503 },
    );
  }

  const text = await res.text();
  let data: { success?: boolean; data?: { token?: string; admin?: unknown }; message?: string } =
    {};
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    return NextResponse.json(
      { success: false, message: loginFailureMessageForClient(502) },
      { status: 502 },
    );
  }

  if (!res.ok || !data.success || !data.data?.token) {
    const status = res.status >= 400 ? res.status : 401;
    return NextResponse.json(
      {
        success: false,
        message: loginFailureMessageForClient(status, data.message),
        errors: (data as { errors?: unknown }).errors,
      },
      { status },
    );
  }

  const out = NextResponse.json({
    success: true,
    data: { admin: data.data.admin },
  });

  try {
    out.cookies.set(ADMIN_TOKEN_COOKIE, data.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch (err) {
    console.error("[admin/auth/login] failed to set session cookie", err);
    return NextResponse.json(
      { success: false, message: loginFailureMessageForClient(500) },
      { status: 500 },
    );
  }

  return out;
}
