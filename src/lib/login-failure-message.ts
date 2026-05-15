/**
 * Maps upstream login failures to copy safe for browsers (no Prisma/SQL paths).
 */

function looksTechnical(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("prisma") ||
    m.includes("postgres") ||
    m.includes("invalid `") ||
    m.includes("does not exist in the current database") ||
    (m.includes("relation ") && m.includes("does not exist")) ||
    m.includes("econnrefused")
  );
}

const GENERIC =
  "We couldn't sign you in right now. Please try again in a moment.";

const CREDENTIALS_HINT =
  "That email or password doesn't look right. Please try again.";

const DISABLED = "This account has been disabled. Contact an administrator if you need access.";

const UNREACHABLE =
  "Could not reach the sign-in service. Check that the API is running and SEER_BACKEND_URL points at a reachable host (try the proxy URL if you use one).";

export function loginFailureMessageForClient(
  httpStatus: number,
  serverMessage?: string,
): string {
  const trimmed = serverMessage?.trim();

  if (httpStatus === 502 || httpStatus === 503) {
    return UNREACHABLE;
  }

  if (httpStatus === 401) {
    if (trimmed === "Invalid credentials.") {
      return CREDENTIALS_HINT;
    }
    return trimmed && !looksTechnical(trimmed) ? trimmed : CREDENTIALS_HINT;
  }

  if (httpStatus === 403) {
    if (trimmed === "Account disabled.") {
      return DISABLED;
    }
    return trimmed && !looksTechnical(trimmed) ? trimmed : GENERIC;
  }

  if (httpStatus >= 500) {
    return GENERIC;
  }

  if (trimmed && !looksTechnical(trimmed) && trimmed.length <= 400) {
    return trimmed;
  }

  if (httpStatus === 400) {
    return "Please check your email and password format and try again.";
  }

  return GENERIC;
}
