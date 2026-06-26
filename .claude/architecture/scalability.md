# Scalability

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [database/indexes](../database/indexes.md) · [backend/queues](../backend/queues.md) · [quality/performance](../quality/performance.md)

## Purpose
Design targets and tactics so the system scales from 1 to thousands of tenants.

## Targets
- 100k+ SKUs per tenant; multi-warehouse; high movement volume.
- P95 reads < 300 ms, writes < 600 ms; dashboard interactive < 2 s.
- 99.9% availability.

## Tactics
- **Stateless apps** (`api`, `worker`) → horizontal scaling behind a load balancer.
- **Async offload** (BullMQ): imports, exports, report generation, emails, webhooks.
- **Read models / projections** for dashboards and reports (don't aggregate hot paths live).
- **Indexes designed before code**, every index justified — see [database/indexes](../database/indexes.md).
- **Pagination everywhere**; cursor-based for large lists; never unbounded queries.
- **Caching (Redis)** for hot, slow-changing reads with explicit invalidation.
- **Connection pooling**; tuned Mongo read/write concerns; transactions only where required.
- **Backpressure & idempotency** on queues; retries with exponential backoff.

## Failure modes to design for
- Hot-partition tenants (very large orgs) — consider sharding key on `organizationId`.
- Ledger growth — archival/rollup strategy for old movements.
- Third-party outages (Stripe/Cloudinary/Resend) — retries, circuit breakers, graceful degradation.

## Scale-out roadmap
Single region → read replicas → multi-region/data residency (Enterprise) → dedicated-tenant option.
