/**
 * Same-origin base path for Laravel public service APIs (payment return polling).
 * The Route Handler at `/api/seer-public-services/*` forwards to `SEER_BACKEND_URL`
 * on the server only — no `NEXT_PUBLIC_*` and identical SSR / client HTML.
 */
export const SEER_PUBLIC_SERVICES_PROXY_BASE = "/api/seer-public-services";

export function getSeerPublicBackendUrl(): string {
  return SEER_PUBLIC_SERVICES_PROXY_BASE;
}
