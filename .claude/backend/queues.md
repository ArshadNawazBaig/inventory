# Queues (BullMQ)

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [architecture/scalability](../architecture/scalability.md) · [services](./services.md)

## Purpose
Run heavy and side-effecting work asynchronously, reliably, in `apps/worker`.

## What goes async
- Bulk import/export (CSV/XLSX), report generation, email (Resend), webhooks,
  barcode batch generation, low-stock alert evaluation, audit/analytics fan-out.

## Rules
- Producers (api) **enqueue**; consumers (worker) process. Keep processors thin and pure.
- **Idempotent jobs**: design for at-least-once delivery; use job/operation keys to dedupe.
- **Retries** with exponential backoff + jitter; cap attempts; route exhausted jobs to a DLQ.
- No long-lived state in a job; fetch what you need by id.
- Respect tenant context — carry `organizationId` in job data; scope all access.
- Emit progress for long jobs (imports/exports) so the UI can poll status.
- Heavy/external I/O never runs inside a DB transaction — trigger via event → queue.

## Conventions
- One queue per concern (`imports`, `exports`, `emails`, `webhooks`, `reports`, `alerts`).
- Typed job payloads validated with Zod (shared from `packages/types`).
- Concurrency and rate limits tuned per queue; monitored. See [devops/monitoring](../devops/monitoring.md).
