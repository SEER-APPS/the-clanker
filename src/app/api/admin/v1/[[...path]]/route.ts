import type { NextRequest } from "next/server";
import { proxyToLaravel } from "@/lib/server/proxy-laravel";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx, method: string): Promise<Response> {
  const { path = [] } = await ctx.params;
  return proxyToLaravel(req, path, method);
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return handle(req, ctx, "GET");
}

export function POST(req: NextRequest, ctx: Ctx): Promise<Response> {
  return handle(req, ctx, "POST");
}

export function PUT(req: NextRequest, ctx: Ctx): Promise<Response> {
  return handle(req, ctx, "PUT");
}

export function PATCH(req: NextRequest, ctx: Ctx): Promise<Response> {
  return handle(req, ctx, "PATCH");
}

export function DELETE(req: NextRequest, ctx: Ctx): Promise<Response> {
  return handle(req, ctx, "DELETE");
}
