# TypeScript

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [coding-standards](./coding-standards.md) · [eslint](./eslint.md)

## Purpose
Maximum type safety, shared across the monorepo.

## Hard rules
- **`strict: true`** everywhere; additionally `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `noFallthroughCasesInSwitch`.
- **Never `any`.** Use `unknown` + narrowing, generics, or precise types.
- **Never `@ts-ignore`/`@ts-expect-error`** without a reviewed, commented justification (rare).
- No non-null assertions (`!`) to silence the compiler — narrow properly.

## Practices
- Prefer **type inference**; annotate public boundaries (exports, function signatures, DTOs).
- Model domains with discriminated unions; make illegal states unrepresentable.
- Use `readonly`/`as const` for immutables; avoid mutation where practical.
- Runtime boundaries validated with **Zod**, then `z.infer` the static type (single source of truth).
- Shared types/schemas live in `packages/types`; consumed by web/api/worker.
- Use branded types for ids where mixing would be dangerous (e.g., `OrganizationId`).

## Config
- Shared base config in `packages/tsconfig`; project references for build performance.
