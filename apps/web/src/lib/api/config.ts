/**
 * API client configuration. The web app talks to the NestJS API over REST (api-first).
 *
 * By default the base is the **same-origin** `/api`, which a Next rewrite proxies to the API (see
 * next.config.mjs) — so the httpOnly session cookie stays first-party and there is no cross-origin CORS to
 * configure. Set `NEXT_PUBLIC_API_URL` to an absolute URL to call the API directly instead (then the API must
 * allow the web origin with credentials). Either way requests send `credentials: 'include'`; the tenant + actor
 * are derived **server-side** from the session, never sent by the client.
 */

/** Base URL including the global `/api` prefix (relative = same-origin via the proxy). Versioned: `/v1/...`. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '/api';
