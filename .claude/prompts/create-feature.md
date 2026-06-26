# Prompt: Create a Feature

> **Status:** 🟡 Seed · **Owner:** Eng · **Use:** paste/reference when building a new feature.

You are building a feature for **StockFlow** under the rules in [CLAUDE.md](../CLAUDE.md).
Follow the documentation-first process and the mandatory response format.

## Inputs to provide
- Feature name & the user story (role, capability, value) + acceptance criteria.
- Affected module(s) and tier (Starter/Growth/Enterprise).

## Required output (in order)
1. **Analysis** — problem, constraints, affected modules/boundaries.
2. **Architecture Decisions** — data model touches, API surface, async needs, events.
3. **Advantages** — why this approach.
4. **Possible Improvements** — alternatives, trade-offs (recommend the best one explicitly).
5. **Production-Ready Implementation** — in this order:
   - Docs update (PRD/module doc) → DB (collections/indexes/transactions) → API (DTOs, Swagger,
     permissions, errors) → backend services/repositories → frontend (UI from `@stockflow/ui`,
     queries, forms) → tests.
6. **Testing Notes** — unit/integration/permission/tenant-isolation/E2E to add.
7. **Future Scalability** — limits and next steps.

## Must comply with
- Tenant scoping + RBAC permission for every operation (define the permission key).
- Stock writes go through the immutable ledger inside a transaction.
- No `any`, no UI built in pages, validate input & output.
- Update `.claude`/`docs` and the permission catalog as part of the change.
