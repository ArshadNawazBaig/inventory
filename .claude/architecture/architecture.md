# Architecture

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) (canonical, Phase 3)

## Purpose
High-level shape of the system. The authoritative, approved version is
[`/docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) (to be completed in Phase 3); this is the
working summary for day-to-day reference.

## System context
```
[ Web (Next.js) ]──HTTP──▶[ API (NestJS) ]──▶[ MongoDB ]
        │                        │             [ Redis ]
        │                        ├──enqueue──▶[ BullMQ queues ]──▶[ Worker (NestJS) ]
        ▼                        ▼
  Better Auth            Cloudinary · Stripe · Resend · Sentry · PostHog
```

## Layering (Clean Architecture)
1. **Domain** — entities, value objects, domain rules (framework-free).
2. **Application** — use cases / services orchestrating domain + ports.
3. **Infrastructure** — Mongoose repositories, queues, third-party adapters.
4. **Presentation** — NestJS controllers (API), Next.js routes/components (web).

Dependencies point **inward only**. See [dependency-rules](./dependency-rules.md).

## Key invariants
- Multi-tenant, `organizationId`-scoped everywhere.
- Immutable stock ledger → on-hand projection.
- Async-first for heavy work (BullMQ).
- API-first; web is the first of many clients.

## Realtime (Socket.IO)
- API hosts the **Socket.IO gateway**; the worker emits events (stock changes, notifications).
- Multi-instance fan-out via the **Socket.IO Redis adapter**; handshakes reuse Better Auth + tenant
  context (clients only receive their own org's events). API docs via **Swagger/OpenAPI**.

## Cross-cutting concerns
AuthN/Z, validation, rate limiting, logging (Pino), errors (Sentry), audit logging, caching (Redis),
realtime (Socket.IO).
