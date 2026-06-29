import type { CookieOptions } from 'express';

/** Name of the httpOnly session cookie the auth flows set and the {@link AuthGuard} reads. */
export const SESSION_COOKIE_NAME = 'stockflow_session';

/**
 * Cookie attributes for the session credential: **httpOnly** (no JS access), **SameSite=Lax** (sent on
 * top-level navigations + same-site XHR, CSRF-resistant for our cross-port dev/prod split), **Secure** in
 * production, scoped to the whole site. `maxAge` matches the session TTL.
 */
export function sessionCookieOptions(maxAgeMs: number, secure: boolean): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: maxAgeMs };
}

/** Attributes used to clear the session cookie on logout (must match the set attributes except maxAge). */
export function clearSessionCookieOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', secure, path: '/' };
}

/** Parse a raw `Cookie` header into a name→value map (avoids a cookie-parser dependency). */
export function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (!name) continue;
    cookies[name] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return cookies;
}
