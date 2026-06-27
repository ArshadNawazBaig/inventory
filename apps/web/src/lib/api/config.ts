/**
 * API client configuration. The web app talks to the NestJS API over REST (api-first); the base URL
 * is build-time configurable so the same bundle runs against local / preview / prod backends.
 *
 * Tenant context: in production the tenant is derived **server-side** from the session (Better Auth) —
 * never from the client. Until the auth module lands, the API exposes a non-production-only dev shim
 * (`DevAuthGuard`, ADR-011) that reads `x-organization-id` / `x-user-id`; production ignores those
 * headers and fails closed. We therefore attach them **only outside production**, mirroring the API.
 */

/** Base URL including the global `/api` prefix. Versioned resources live under `/v1/...`. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001/api';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** Dev-only tenant identity, matching the API's temporary `DevAuthGuard`. */
const DEV_ORGANIZATION_ID = process.env.NEXT_PUBLIC_DEV_ORG_ID ?? 'org-dev';
const DEV_USER_ID = process.env.NEXT_PUBLIC_DEV_USER_ID ?? 'user-dev';

/**
 * Headers that carry the (temporary) dev tenant context. Empty in production, where the server derives
 * the tenant from the authenticated session. Replaced by Better Auth cookies when auth lands.
 */
export function devTenantHeaders(): Record<string, string> {
  if (IS_PRODUCTION) return {};
  return {
    'x-organization-id': DEV_ORGANIZATION_ID,
    'x-user-id': DEV_USER_ID,
  };
}
