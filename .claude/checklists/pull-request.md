# Checklist: Pull Request

> **Status:** 🟡 Seed · **Owner:** Eng · **Related:** [quality/code-review](../quality/code-review.md)

## Author
- [ ] Small, focused scope; clear description + linked story/issue.
- [ ] Screenshots/recording for UI changes (light + dark).
- [ ] CI green: lint, typecheck, tests, build, security scan.
- [ ] Docs/Swagger/permission catalog/changelog updated as needed.

## Correctness & security
- [ ] Tenant scoping + permission check on every relevant operation (server-side).
- [ ] Input validated & whitelisted; output allow-listed (no entity/secret leakage).
- [ ] Stock writes via immutable ledger inside a transaction; idempotent side effects.
- [ ] Cross-tenant access returns 404; no existence leaks.

## Quality
- [ ] No `any`, no `@ts-ignore`, no disabled ESLint (or justified + commented).
- [ ] Logic in the correct layer; module boundaries & dependency rules respected.
- [ ] No N+1/unbounded queries; indexes present for new query patterns.

## Tests
- [ ] Unit + integration; permission + tenant-isolation where relevant; regression for bug fixes.

## UI (if applicable)
- [ ] Components from `@stockflow/ui`; accessible (keyboard, contrast, labels); responsive.
- [ ] Loading/empty/error states present.

## Merge
- [ ] At least one approval; author did not self-merge core changes.
