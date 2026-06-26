# Repositories

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [services](./services.md) · [database/multi-tenancy](../database/multi-tenancy.md)

## Purpose
Encapsulate all data access behind interfaces so the domain never touches Mongoose.

## Principles
- Define a **port** (interface) in application/domain; implement it in infrastructure with Mongoose.
- Services depend on the interface, enabling fakes in tests and swappable implementations.
- Repositories map between persistence documents and domain entities (no leaking Mongoose docs).

## Rules
- **Tenant scoping is automatic** via a base repository that injects `organizationId` into every
  query/insert from `TenantContext` — call sites cannot forget it. See [multi-tenancy](../database/multi-tenancy.md).
- Repositories expose intention-revealing methods (`findActiveBySku`), not raw query builders.
- No business logic in repositories — only persistence concerns.
- Transactions are passed in (session) from the service layer for multi-document writes.
- Soft-delete aware by default (exclude `deletedAt` unless explicitly included).
- Pagination/filtering/sorting are first-class params, mapped to indexed queries.

## Don'ts
- No cross-module repository access (go through the owning module's service).
- No unbounded `find()` without pagination on large collections.
