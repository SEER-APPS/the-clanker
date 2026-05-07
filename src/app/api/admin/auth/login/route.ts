import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_TOKEN_COOKIE } from "@/lib/admin-cookie";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const base = process.env.SEER_BACKEND_URL?.replace(/\/+$/, "");
  if (!base) {
    return NextResponse.json(
      { success: false, message: "Server misconfiguration." },
      { status: 503 },
    );
  }

  const body = await request.text();
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

  const res = await fetch(`${base}/api/admin/v1/auth/login`, {
    method: "POST",
    headers,
    body,
  });

  const text = await res.text();
  let data: { success?: boolean; data?: { token?: string; admin?: unknown }; message?: string } =
    {};
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid response from server." },
      { status: 502 },
    );
  }

  if (!res.ok || !data.success || !data.data?.token) {
    return NextResponse.json(
      {
        success: false,
        message: data.message ?? "Login failed.",
        errors: (data as { errors?: unknown }).errors,
      },
      { status: res.status >= 400 ? res.status : 401 },
    );
  }

  const out = NextResponse.json({
    success: true,
    data: { admin: data.data.admin },
  });

  out.cookies.set(ADMIN_TOKEN_COOKIE, data.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return out;
}
