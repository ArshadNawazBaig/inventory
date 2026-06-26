# Checklist: New Module

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [architecture/module-boundaries](../architecture/module-boundaries.md)

## Boundaries & design
- [ ] Bounded context defined: what it owns, what it must not touch.
- [ ] Public interface (service ports) + domain events designed; internals kept private.
- [ ] Dependency rules respected (inward only; no cross-`app` imports). See [dependency-rules](../architecture/dependency-rules.md).
- [ ] ADR recorded for significant decisions. See [design-decisions](../architecture/design-decisions.md).

## Structure
- [ ] Module folder follows layering: domain/application/infrastructure/presentation.
      See [folder-structure](../architecture/folder-structure.md).
- [ ] Shared types/schemas placed in `packages/types`.

## Data
- [ ] Collections, relationships, indexes, transactions documented. See [database/collections](../database/collections.md).
- [ ] All documents tenant-scoped (`organizationId`) + standard fields.

## API & security
- [ ] Endpoints follow API standards; DTOs + Swagger complete.
- [ ] Permission catalog extended; RBAC + tenant isolation enforced and tested.

## Quality
- [ ] Test suite (unit/integration/permission/tenant) scaffolded.
- [ ] Docs added to `.claude` + `/docs` and indexed.

## Done
- [ ] Architecture review passed; CI green.
