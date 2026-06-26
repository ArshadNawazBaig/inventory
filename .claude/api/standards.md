# API Standards

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [API_SPEC.md](../../docs/API_SPEC.md) (canonical, Phase 6) · all `api/*`

## Purpose
The contract conventions every REST endpoint follows. Canonical spec:
[`/docs/API_SPEC.md`](../../docs/API_SPEC.md) (Phase 6).

## Principles
- **REST**, resource-oriented, predictable, documented (Swagger). API-first.
- Every endpoint: AuthN + AuthZ + Request DTO + Response DTO + error responses + Swagger.
- Consistent envelope, pagination, filtering, sorting, errors, versioning across all resources.

## Conventions
- HTTP methods: `GET` (read), `POST` (create/action), `PATCH` (partial update), `PUT` (replace),
  `DELETE` (soft delete).
- Status codes used correctly (200/201/204/400/401/403/404/409/422/429/5xx). See [errors](./errors.md).
- Plural, kebab-case resource paths. See [naming](./naming.md).
- Mutations require permissions; all reads/writes tenant-scoped.
- Idempotency keys for non-idempotent critical operations.
- Rate limiting and request size limits on every route.

## Response envelope (draft)
```
// item
{ "data": { ... } }
// list
{ "data": [ ... ], "meta": { "page": {...}, "total": 123 } }
// error  (see ./errors.md)
{ "error": { "code": "...", "message": "...", "details": [ ... ] } }
```
