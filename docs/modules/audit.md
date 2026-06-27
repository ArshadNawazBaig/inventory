# Audit Module (immutable activity trail)

| Field | Value |
|-------|-------|
| **Document** | Audit Logs Design (who-did-what trail) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/audit`](../../apps/api/src/modules/audit) · frontend [`apps/web/src/features/audit`](../../apps/web/src/features/audit) |
| **Phase** | Module design + Backend + Frontend (Wave 7) |
| **Depends on** | Nothing (cross-cutting recorder) · [database/audit-logs](../../.claude/database/audit-logs.md) · [security/audit](../../.claude/security/audit.md) |
| **Owner** | Security Engineer / Principal Architect |

> An **immutable, append-only** record of who did what, when, to which entity. Written server-side, close to
> the action, so clients can't bypass it. Decisions: **Decision → Why → Rejected**.

---

## 1. Scope & boundary
**Owns:** `audit_logs` (append-only). **References:** nothing — the write side is a generic recorder, so the
module depends on no domain module (strictly one-way; no cycles). Other modules never import Audit.

---

## 2. Entity
`AuditLogEntity`: `{ organizationId, actorId, actorType (user|system|api_key), action (e.g.
`purchase_order.received`), entityType, entityId, before, after (redacted diff; null for
interceptor-sourced entries), metadata { ip, userAgent, requestId, method, path, statusCode }, createdAt }`.
**No updates, no deletes** — ever.

---

## 3. How entries are written
A single global **`AuditInterceptor`** records **every successful mutating request** (`POST`/`PATCH`/`PUT`/
`DELETE`). It runs after the guards (only authorized actions are logged) and on the success path (close to the
write). The `{ action, entityType, entityId }` is derived from the route by a **pure, exhaustively-tested
helper** (`common/audit/audit-target.ts`): a sub-action segment maps to a past-tense verb
(`…/receive → purchase_order.received`), otherwise the HTTP method does (`POST → created`, `PATCH → updated`,
`DELETE → deleted`); the id comes from the `:id` param or the created entity in the response. Actor + request
metadata come from the request context. Writes go through the cross-cutting **`AUDIT_RECORDER`** port, which the
module binds to its `AuditService`. Recording is **best-effort** — a failure is logged, never breaks the user's
request.

> **Decision** — capture at a **global interceptor**, not per-module domain events. **Why** — uniform coverage
> of *all* modules (incl. orders, which emit no events) with zero per-module churn; can't be bypassed by
> clients; one wiring point. **Rejected** — wiring each module's (fragmented) event publishers into audit;
> HTTP-request logging only (too coarse, no domain action/entity). **Follow-up** — domain callers can use the
> same `AUDIT_RECORDER` to attach rich redacted `before`/`after` diffs; audit security-relevant **denials**.

---

## 4. API
Base `/api/v1`. `GET /audit-logs` (filters: `action`, `entityType`, `entityId`, `actorId`, `from`/`to`,
pagination, `-createdAt` default) · `GET /audit-logs/:id`. **Read-only** — no write/update/delete endpoints.
Permission: `audit.view`. Tenant-scoped; cross-tenant → 404. `requestId` on every response.

---

## 5. Architecture
The `AuditInterceptor` (in `common/interceptors`, registered globally in `app.module`) depends only on the
`AUDIT_RECORDER` token (in `common/audit`). `AuditModule` provides the in-memory append-only repo + binds
`AUDIT_RECORDER → AuditService` and exports it. Frontend: a filterable read-only viewer (entity type · action ·
date range) with a per-entry detail modal (actor, target, request metadata, any diff).

---

## 6. Testing notes
Pure deriver unit tests (create/sub-action/PATCH/DELETE/adjustments/archive-restore/skip/fallback). Service:
record→read-back, null diffs default, filters (action/entityType/entityId/actorId/date-range), newest-first
sort, tenant isolation on list + get, unknown id → 404. Contracts: query defaults + date/ISO bounds + strict;
response actor-type enum. Frontend: format helpers (`humanizeAction`/`humanizeEntityType`/`formatActorType`).

---

## 7. Status
🟢 **Implemented** (Wave 7). Sync `audit.{view,manage→view,export}` into AUTHENTICATION §10. Follow-ups: async
**export** job (`audit.export`) via BullMQ; audit security-relevant **denials** (403/tenant/rate-limit); rich
domain `before`/`after` diffs; Mongoose adapter (immutable collection + per-tenant retention).
