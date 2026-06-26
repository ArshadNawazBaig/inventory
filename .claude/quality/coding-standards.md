# Coding Standards

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [CODING_STANDARDS.md](../../docs/CODING_STANDARDS.md) (canonical) · [typescript](./typescript.md) · [eslint](./eslint.md)

## Purpose
The engineering rules every module follows. Canonical doc:
[`/docs/CODING_STANDARDS.md`](../../docs/CODING_STANDARDS.md).

## Principles
- **Clean Architecture, SOLID, DRY, KISS, YAGNI.** Composition over inheritance.
- Self-documenting code: clear names, small functions, obvious control flow.
- One canonical way to do a thing — consistency beats personal preference.

## Hard rules
- **No `any`**, no `@ts-ignore`, no disabling ESLint (see [typescript](./typescript.md), [eslint](./eslint.md)).
- No duplicated logic — extract to `packages/utils`/shared modules.
- No business logic in controllers or repositories — it lives in services.
- No UI primitives in pages — consume `@stockflow/ui`.
- Tenant scope + permission checks on every relevant operation, server-side.
- Validate input and output (Zod/DTO); never trust the client.

## Style
- Naming per [context/terminology](../context/terminology.md).
- Small files, single responsibility; barrels expose only the public surface.
- Comments explain **why**, not what; keep them rare and meaningful.
- Errors are typed and handled at the edge (see [backend/error-handling](../backend/error-handling.md)).

## Definition of Done
Typed · validated · tested · documented · accessible (UI) · secure · reviewed. See
[code-review](./code-review.md) and [checklists/pull-request](../checklists/pull-request.md).
