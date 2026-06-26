# ESLint & Formatting

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [typescript](./typescript.md) · [coding-standards](./coding-standards.md)

## Purpose
Automated, consistent code quality — enforced, not suggested.

## Rules
- Shared config in `packages/eslint-config`, extended by every app/package.
- **Never disable ESLint** (file/line) without a reviewed, commented justification (rare).
- Type-aware linting (`@typescript-eslint`) enabled; lint runs in CI and blocks merges.
- **Prettier** for formatting (no style debates); format-on-save + CI check.
- Import hygiene: ordered imports, no cycles (`import/no-cycle`), no cross-boundary imports
  (enforce dependency rules — see [architecture/dependency-rules](../architecture/dependency-rules.md)).

## Key rule sets
- No `any`/unsafe-* ; no unused vars/exports; exhaustive switch; no floating promises;
  no `console` in app code (use Pino); accessibility lint (`jsx-a11y`) on the web app.
- Boundary rules: `apps` can't import other `apps`; `packages/types` & `utils` stay leaf.

## Workflow
- Pre-commit: lint-staged runs ESLint + Prettier on changed files.
- CI: `lint`, `typecheck`, `test` gates required before merge. See [devops/github-actions](../devops/github-actions.md).
