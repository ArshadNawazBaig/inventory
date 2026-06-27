# Notifications module (in-app inbox)

A **per-recipient** in-app notification inbox with read state. See
[`docs/modules/notifications.md`](../../../../../docs/modules/notifications.md).

## How notifications are produced
A curated global **`NotificationInterceptor`** ([`common/interceptors`](../../common/interceptors/notification.interceptor.ts))
turns a small allow-list of **noteworthy state transitions** (PO submitted/received, SO confirmed/fulfilled,
transfer dispatched/received, return completed) into a notification — reusing the audit route deriver, then a
pure rules table ([`common/notifications/notification-rules.ts`](../../common/notifications/notification-rules.ts)).
Unlike audit (which records *every* mutation), this is selective. The recipient is the acting user for now;
**role/member fan-out** (notify the *other* relevant users) is the headline follow-up once Members lands.

Producers write through the cross-cutting **`NOTIFIER`** port
([`common/notifications/notifier.ts`](../../common/notifications/notifier.ts)), which this module binds to its
`NotificationService`. The worker / domain services can use the same port later.

## Read & manage API
`GET /api/v1/notifications` (filters: `status` = all|unread|read, `type`, pagination, `-createdAt`) ·
`GET /api/v1/notifications/unread-count` (the navbar bell badge) · `POST /api/v1/notifications/:id/read`
(idempotent) · `POST /api/v1/notifications/read-all`. Permission: `notification.view`. Every read/write is
scoped to the acting user — you only ever see your own inbox; another recipient's id → 404.

## Layout
```
domain/         entities (NotificationEntity)
application/    ports, notification.service (implements Notifier + read/manage)
infrastructure/ in-memory.repository (per-recipient; status + type filters)
presentation/   dto, mappers, notification.controller
```

## Dependencies
Depends on **no domain module** → strictly one-way, no cycles. The interceptor is wired once in `app.module`.

## Follow-ups
Role/member fan-out; **email** (Resend) + **realtime** (Socket.IO) delivery via the worker/queue; low-stock
alerts from the inventory event stream; user notification preferences; Mongoose adapter.
