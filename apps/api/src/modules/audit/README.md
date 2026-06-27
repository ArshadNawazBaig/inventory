# Audit module (immutable activity trail)

An **append-only** record of who did what, when, to which entity — the backbone of trust. See
[`docs/modules/audit.md`](../../../../../docs/modules/audit.md), `.claude/database/audit-logs.md` and
`.claude/security/audit.md`.

## How entries are written
A single global **`AuditInterceptor`** ([`common/interceptors`](../../common/interceptors/audit.interceptor.ts))
records **every successful mutating request** (`POST`/`PATCH`/`PUT`/`DELETE`) — server-side, after the guards
(so only authorized actions are logged), close to the write so clients can't bypass it. The `{ action,
entityType, entityId }` is derived from the route by a pure, tested helper
([`common/audit/audit-target.ts`](../../common/audit/audit-target.ts)); actor + `{ ip, userAgent, requestId,
method, path, statusCode }` come from the request. Recording is best-effort — a failure is logged, never
breaks the user's request.

The interceptor writes through the cross-cutting **`AUDIT_RECORDER`** port
([`common/audit/audit-recorder.ts`](../../common/audit/audit-recorder.ts)), which this module binds to its
`AuditService`. Domain code can also call the recorder directly to attach rich redacted `before`/`after` diffs.

## Read API
`GET /api/v1/audit-logs` (filters: `action`, `entityType`, `entityId`, `actorId`, `from`/`to`, pagination,
`-createdAt` default) · `GET /api/v1/audit-logs/:id`. Permission: `audit.view`. Tenant-scoped; cross-tenant → 404.

## Layout
```
domain/         entities (AuditLogEntity)
application/    ports, audit.service (implements AuditRecorder + read side)
infrastructure/ in-memory.repository (append-only; entity/actor/action + date-range filters)
presentation/   dto, mappers, audit-log.controller
```

## Dependencies
Depends on **no domain module** (the recorder is generic) → strictly one-way, no cycles. Other modules don't
import Audit; the interceptor is wired once in `app.module`.

## Permissions
`audit.{view,export}` — sync into AUTHENTICATION §10. (`export` reserved for the async export job — follow-up.)
