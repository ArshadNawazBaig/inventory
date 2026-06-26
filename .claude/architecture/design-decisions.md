# Design Decisions (ADR log)

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [PRD §13](../../docs/PRODUCT_REQUIREMENTS.md)

## Purpose
A running Architecture Decision Record. Every significant choice — including each new
dependency — is recorded here with context, decision, and consequences.

## Format
```
### ADR-NNN — <title>
- Status: Proposed | Accepted | Superseded by ADR-XXX
- Context: <forces at play>
- Decision: <what we chose>
- Consequences: <trade-offs, follow-ups>
```

## Accepted decisions (from PRD)
### ADR-001 — Multi-tenant shared DB with `organizationId` scoping
- Status: Accepted · Context: lowest ops overhead at our scale, isolation must be provable.
- Decision: shared DB; `organizationId` on every collection; enforced at data-access layer.
- Consequences: requires adversarial isolation tests; dedicated-DB option deferred to Enterprise.

### ADR-002 — Immutable stock ledger as source of truth
- Decision: append-only `stock_movements`; on-hand is a derived `stock_levels` projection.
- Consequences: every quantity is explainable; reconciliation tooling needed; no in-place edits.

### ADR-003 — Product → Variant → Stock model
- Decision: two-level catalog; SKU lives on the variant.
- Consequences: avoids the flat-SKU dead end; slightly more join/lookup work.

### ADR-004 — Hierarchical locations, bins optional
### ADR-005 — RBAC: granular permissions + system & custom roles, deny-by-default
### ADR-006 — Async-by-default heavy work via BullMQ
### ADR-007 — API-first; web is the first client

## Open decisions (need ratification)
- Package manager/task runner (pnpm + Turborepo proposed).
- Inventory valuation method default (weighted-average proposed).
- Monetization shape (hybrid seats + usage caps proposed).
