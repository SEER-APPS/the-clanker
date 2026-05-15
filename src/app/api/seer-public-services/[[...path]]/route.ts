import type { NextRequest } from "next/server";
import { proxyLaravelPublicServices } from "@/lib/server/proxy-laravel-public-services";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(
  req: NextRequest,
  ctx: Ctx,
  method: string,
): Promise<Response> {
  const { path = [] } = await ctx.params;
  return proxyLaravelPublicServices(req, path, method);
}

export function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  return handle(req, ctx, "GET");
}

export function POST(req: NextRequest, ctx: Ctx): Promise<Response> {
  return handle(req, ctx, "POST");
}
