# NestJS

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [services](./services.md) · [repositories](./repositories.md) · [folder-structure](../architecture/folder-structure.md)

## Purpose
Conventions for `apps/api` and `apps/worker` (NestJS, Clean Architecture per module).

## Module structure
- One NestJS module per bounded context (see [module-boundaries](../architecture/module-boundaries.md)).
- Layers inside a module: `domain` → `application` → `infrastructure` → `presentation`.
- Wire dependencies via DI and **port interfaces**; depend on abstractions, not concretions.

## Rules
- Controllers are thin: validate (DTO), delegate to a use case/service, map to Response DTO.
- Business logic lives in application/domain services — **never** in controllers or repositories.
- Cross-cutting concerns via Nest building blocks:
  - **Guards** — auth + RBAC + tenant context.
  - **Interceptors** — logging, response shaping, timeouts.
  - **Pipes** — validation/transformation (Zod/class-validator).
  - **Filters** — consistent error responses. See [error-handling](./error-handling.md).
- Config is validated at boot; fail fast on missing env. See [devops/environments](../devops/environments.md).
- Every mutating use case is permission-checked and tenant-scoped.

## Workers
- `apps/worker` consumes BullMQ queues; processors are thin and idempotent. See [queues](./queues.md).
