# Notifications Module (in-app inbox)

| Field | Value |
|-------|-------|
| **Document** | Notifications Design (in-app inbox) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/notifications`](../../apps/api/src/modules/notifications) · frontend [`apps/web/src/features/notifications`](../../apps/web/src/features/notifications) |
| **Phase** | Module design + Backend + Frontend (Wave 7) |
| **Depends on** | Nothing (cross-cutting producer) · reuses the audit route deriver |
| **Owner** | Principal Architect |

> A **per-recipient** in-app inbox with read state. Noteworthy state transitions become notifications; the
> recipient reads/marks them read; the navbar bell shows the unread count. Decisions: **Decision → Why →
> Rejected**.

---

## 1. Scope & boundary
**Owns:** `notifications` (one row per recipient). **References:** nothing — the producer is a generic
`Notifier` port, so the module depends on no domain module (one-way; no cycles). Other modules never import it.

---

## 2. Entity
`NotificationEntity`: `{ organizationId, recipientId, type (purchase_order|sales_order|transfer|return|
inventory|system), title, body, entityType, entityId, link (deep link), readAt (null = unread), createdAt }`.

---

## 3. How notifications are produced
A **curated** global `NotificationInterceptor` records a small allow-list of state transitions (PO
submitted/received, SO confirmed/fulfilled, transfer dispatched/received, return completed). It **reuses the
audit route deriver** to resolve `{ action, entityId }`, then a pure rules table renders the copy + deep link.
Writes flow through the cross-cutting **`NOTIFIER`** port, bound to `NotificationService`.

> **Decision** — produce via a **curated** interceptor (allow-list), reusing the audit deriver; **recipient =
> the acting user** for this wave. **Why** — covers every module uniformly with zero churn and consistent with
> the Wave-7 audit pattern; the actor is the only knowable recipient before a Members/roles module exists.
> **Rejected** — auditing *every* mutation as a notification (noise); wiring each domain service (churn);
> blocking on Members. **Follow-up (ADR-025)** — **role/member fan-out** (notify the *other* relevant users),
> **email** (Resend) + **realtime** (Socket.IO) delivery via the worker/queue, low-stock alerts from the
> inventory event stream, and user preferences.

---

## 4. API
Base `/api/v1`. `GET /notifications` (filters: `status`=all|unread|read, `type`, pagination, `-createdAt`) ·
`GET /notifications/unread-count` · `POST /notifications/:id/read` (idempotent) · `POST /notifications/read-all`.
Permission: `notification.view`. **Every read/write is scoped to the acting user** — you only see your own
inbox; another recipient's id → 404. `requestId` on every response.

---

## 5. Architecture
The `NotificationInterceptor` (in `common/interceptors`, registered globally) depends only on the `NOTIFIER`
token (`common/notifications`). `NotificationsModule` provides the in-memory per-recipient repo + binds
`NOTIFIER → NotificationService`. Frontend: a navbar **bell** (polled unread badge + a popover of recent items)
and a `/notifications` page (status filter, mark-all-read, pagination); clicking an item marks it read and
deep-links to the entity.

---

## 6. Testing notes
Pure rules-deriver tests (curated transitions matched; creates/edits/cancels/unrelated → null). Service:
enqueue→read-back, recipient + tenant scoping, anonymous actor → empty, mark-read (idempotent) drops the count,
cross-recipient → 404, mark-all-read count, status/type filters. Contracts: query defaults/enums/strict;
response read+unread. Frontend: format helpers (label map + relative-time buckets).

---

## 7. Status
🟢 **Implemented** (Wave 7). Sync `notification.view` into AUTHENTICATION §10. Follow-ups in §3 (role/member
fan-out; email + realtime delivery; low-stock alerts; preferences; Mongoose adapter).
