# Monorepo

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [folder-structure](./folder-structure.md) · [dependency-rules](./dependency-rules.md)

## Purpose
Define the workspace layout and how apps/packages relate.

## Layout
```
/apps
  web        # Next.js frontend
  api        # NestJS REST API
  worker     # NestJS BullMQ consumers (jobs, emails, reports, webhooks)
/packages
  ui             # Design-system components (the ONLY source of UI)
  icons          # Icon set
  hooks          # Shared React hooks
  types          # Shared TypeScript types / Zod schemas (contracts)
  utils          # Framework-agnostic helpers
  config         # Shared runtime config & constants
  eslint-config  # Shared ESLint rules
  tsconfig       # Shared TS configs
  docs           # Internal docs site (optional)
/infrastructure  # Docker, Railway, IaC, compose files
/scripts         # Dev/ops scripts
```

## Tooling (proposed — confirm in design-decisions)
- **Package manager:** pnpm workspaces.
- **Task runner:** Turborepo for build/test caching and pipelines.
- **TS:** project references via `packages/tsconfig`.

## Sharing rules
- `apps/*` depend on `packages/*`, never on each other.
- `packages/types` holds the **contracts** shared by web/api/worker (DTOs, Zod schemas).
- No circular dependencies (enforced in CI). See [dependency-rules](./dependency-rules.md).
