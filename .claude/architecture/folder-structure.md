# Folder Structure

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [monorepo](./monorepo.md) · [backend/nestjs](../backend/nestjs.md) · [frontend/nextjs](../frontend/nextjs.md)

## Purpose
A predictable place for every file. Feature-first, layered within each feature.

## `apps/api` (NestJS, Clean Architecture per module)
```
src/
  modules/
    <feature>/
      domain/            # entities, value objects, domain services
      application/       # use cases, ports (interfaces)
      infrastructure/    # mongoose schemas, repositories, adapters
      presentation/      # controllers, DTOs, mappers
      <feature>.module.ts
  common/                # guards, interceptors, filters, decorators, pipes
  config/                # env loading & validation
  main.ts
```

## `apps/web` (Next.js App Router)
```
src/
  app/                   # routes (route groups by domain)
  features/<feature>/    # feature UI: components, hooks, queries, schemas
  lib/                   # api client, query client, utils
  stores/                # Zustand stores
  styles/
```
UI primitives are imported from `@stockflow/ui` — never redefined here. See [ui/component-rules](../ui/component-rules.md).

## `apps/worker`
```
src/
  processors/<queue>/    # one folder per queue
  jobs/                  # job definitions & schemas
  main.ts
```

## Conventions
- One feature = one folder; colocate everything it needs.
- `index.ts` barrels expose a module's public surface only.
- Test files live beside source: `*.spec.ts` (unit), `*.e2e-spec.ts` (e2e).
