import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_TOKEN_COOKIE } from "@/lib/admin-cookie";

export async function POST(_request: NextRequest): Promise<NextResponse> {
  const base = process.env.SEER_BACKEND_URL?.replace(/\/+$/, "");
  const jar = await cookies();
  const token = jar.get(ADMIN_TOKEN_COOKIE)?.value;

  if (base && token) {
    const headers = new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    });
    if (process.env.MOBILE_API_KEY) {
      headers.set("X-Seer-Client-Key", process.env.MOBILE_API_KEY);
    }
    if (process.env.ADMIN_API_SECRET) {
      headers.set("X-Seer-Admin-Key", process.env.ADMIN_API_SECRET);
    }
    await fetch(`${base}/api/admin/v1/auth/logout`, { method: "POST", headers });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
