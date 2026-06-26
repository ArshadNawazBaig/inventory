# Dependency Rules

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [architecture](./architecture.md) · [module-boundaries](./module-boundaries.md)

## Purpose
Keep dependencies pointing the right way so the system stays changeable.

## The dependency rule (Clean Architecture)
Source-code dependencies point **inward only**:
```
presentation → application → domain
infrastructure → application/domain (implements ports)
domain → (nothing — no framework imports)
```
- **Domain** never imports NestJS, Mongoose, Next.js, or any library-specific code.
- **Application** depends on domain + port interfaces, not concrete infrastructure.
- **Infrastructure** implements ports (repositories, adapters) and is wired via DI.

## Cross-package rules (monorepo)
- `apps/*` → `packages/*` only. `apps` never import other `apps`.
- `packages/types` and `packages/utils` are leaf packages (no internal deps).
- `packages/ui` may depend on `icons`, `hooks`, `utils` — not on app code.
- **No circular dependencies** — enforced in CI (e.g. `madge`/eslint-plugin-import).

## Module rules
- Modules talk through public service interfaces or domain events — never internals.
- Only the Inventory module writes the stock ledger.
- Reporting depends on read models only.

## Adding a dependency
New third-party libs require a recorded decision in [design-decisions](./design-decisions.md)
(why, alternatives, bundle/security impact).
