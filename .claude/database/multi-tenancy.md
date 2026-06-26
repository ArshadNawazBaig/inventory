# Multi-Tenancy (data layer)

> **Status:** 🟡 Seed · **Owner:** Database Architect · **Related:** [security/tenant-isolation](../security/tenant-isolation.md) · [indexes](./indexes.md)

## Purpose
Enforce hard tenant isolation in a shared database (ADR-001).

## Rules
- **Every** collection has a required, immutable `organizationId`.
- **Every** query and write is scoped by `organizationId` — no exceptions.
- Scoping is enforced centrally (base repository / Mongoose plugin), not per call site,
  so a developer cannot forget it.
- `organizationId` is taken from the authenticated request context, **never** from the client body.
- Compound indexes always lead with `organizationId`.
- Uniqueness is per-tenant: `{ organizationId, <key> }` unique.

## Enforcement pattern
- A `TenantContext` is established by a guard/middleware from the session.
- The base repository injects `organizationId` into every filter and on every insert.
- A query that somehow lacks tenant scope is rejected/throws in development and tests.

## Testing (mandatory)
- Adversarial cross-tenant tests: user A must never read/write org B's data via any endpoint,
  filter, ID guess, or bulk operation. See [security/tenant-isolation](../security/tenant-isolation.md).

## Future
- Dedicated-DB or per-tenant collections option for Enterprise tier (deferred).
