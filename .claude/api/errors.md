# API Errors

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [backend/error-handling](../backend/error-handling.md) · [standards](./standards.md)

## Purpose
One consistent, safe error contract for the whole API.

## Error shape
```
{
  "error": {
    "code": "INSUFFICIENT_STOCK",        // stable, machine-readable
    "message": "Not enough available stock to fulfill.",  // human, safe
    "details": [                           // optional, field-level
      { "field": "items[0].quantity", "message": "exceeds available (5)" }
    ],
    "requestId": "..."                     // correlation id
  }
}
```

## Status code usage
| Code | When |
|------|------|
| 400 | Malformed request / validation failure (`details` populated) |
| 401 | Missing/invalid/expired session |
| 403 | Authenticated but lacks permission |
| 404 | Not found (incl. cross-tenant — don't reveal existence) |
| 409 | Conflict (unique violation, stale version, invalid state transition) |
| 422 | Semantically invalid (domain rule) when distinct from 400 |
| 429 | Rate limited (include `Retry-After`) |
| 5xx | Unexpected — generic message, logged + Sentry |

## Rules
- Error `code`s are stable constants shared in `packages/types` (clients can branch on them).
- Never leak stack traces, internal messages, query details, or secrets.
- Always include `requestId` for support/debugging correlation.
- Validation errors return all field errors at once where feasible.
