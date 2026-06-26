# Error Handling

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [api/errors](../api/errors.md) · [logging](./logging.md)

## Purpose
Consistent, safe, observable error handling across the API and workers.

## Principles
- **Typed domain errors** (e.g., `InsufficientStockError`, `NotFoundError`, `ForbiddenError`)
  thrown in services; mapped to HTTP by a global exception filter.
- One **error response shape** for the whole API. See [api/errors](../api/errors.md).
- Never leak stack traces, internal messages, or secrets to clients.

## Mapping
| Domain error | HTTP | Notes |
|--------------|------|-------|
| Validation | 400 | Field-level details |
| Unauthenticated | 401 | No/expired session |
| Forbidden (RBAC/tenant) | 403 | Permission denied |
| Not found | 404 | Also for cross-tenant id (avoid existence leak) |
| Conflict | 409 | Unique/version/state conflicts |
| Rate limited | 429 | Retry-After header |
| Unexpected | 500 | Logged + Sentry; generic message to client |

## Rules
- Catch at the edge (global filter), not scattered try/catch swallowing errors.
- Every 5xx is logged with correlation id and reported to Sentry.
- Cross-tenant access returns 404 (don't reveal that the resource exists elsewhere).
- Transient DB/queue errors are retried with backoff, not surfaced as hard failures.
