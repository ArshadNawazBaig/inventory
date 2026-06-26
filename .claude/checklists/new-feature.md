# Checklist: New Feature

> **Status:** 🟡 Seed · **Owner:** Eng · **Related:** [prompts/create-feature](../prompts/create-feature.md)

## Documentation & design
- [ ] User story + acceptance criteria written; tier decided.
- [ ] Module/boundary identified; docs (`.claude`/`docs`) updated **before** coding.
- [ ] Permission key(s) defined in the catalog. See [security/permissions](../security/permissions.md).

## Data
- [ ] Collections/fields designed; embed-vs-reference justified.
- [ ] Indexes added for new query patterns (each justified). See [database/indexes](../database/indexes.md).
- [ ] Transactions used for any stock/critical multi-doc writes.

## API
- [ ] Request + Response DTOs (shared Zod in `packages/types`).
- [ ] AuthN + permission + tenant scoping enforced server-side.
- [ ] Errors mapped; Swagger documented; pagination/filter/sort follow standards.

## Backend
- [ ] Logic in services/domain (not controllers/repos); ports + DI.
- [ ] Side effects via events/queues (idempotent).

## Frontend
- [ ] UI from `@stockflow/ui`; loading/empty/error states; accessible; responsive; light/dark.
- [ ] Permission-gated actions; server data via TanStack Query.

## Quality & security
- [ ] Unit + integration + permission + tenant-isolation tests.
- [ ] No `any`/disabled lint; types precise.
- [ ] Security review for sensitive features. See [checklists/security](./security.md).

## Done
- [ ] Code review approved; CI green; docs/changelog updated.
