/** Absolute session lifetime — should match core `SESSION_ADMIN_DAYS` (default 1 day). */
const parsedMaxAge = Number.parseInt(
  process.env.ADMIN_SESSION_COOKIE_MAX_AGE_SECONDS ?? "",
  10,
);
export const ADMIN_SESSION_COOKIE_MAX_AGE_SECONDS = Number.isFinite(parsedMaxAge)
  ? parsedMaxAge
  : 60 * 60 * 24;
