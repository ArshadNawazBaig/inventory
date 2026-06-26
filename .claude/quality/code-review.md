# Code Review

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [checklists/pull-request](../checklists/pull-request.md) · [coding-standards](./coding-standards.md)

## Purpose
Every change is reviewed for correctness, security, and maintainability before merge.

## Reviewer checklist (summary; full list in checklist)
- **Correctness:** does it do what it claims? Edge cases, error paths, invariants.
- **Security:** tenant scope + permission checks present? Input validated? No secrets? See [security/owasp](../security/owasp.md).
- **Architecture:** respects layering, module boundaries, dependency rules. No logic in the wrong layer.
- **Types:** no `any`/ignores; precise types; shared contracts updated.
- **Tests:** adequate unit/integration/permission tests; regression test for bugs.
- **UI:** from `@stockflow/ui`; accessible; responsive; light/dark.
- **Performance:** no N+1, unbounded queries, or missing indexes for new query patterns.
- **Docs:** relevant `.claude`/`docs` updated; Swagger updated for API changes.

## Rules
- Small, focused PRs; clear description + linked issue/story; screenshots for UI.
- CI green (lint, typecheck, tests) before review approval.
- At least one approval; author never self-merges core changes.
- Be kind and specific; review the code, not the person. Prefer suggestions with rationale.
