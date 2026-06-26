# Prompt: Architecture Review

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Use:** reviewing a design/proposal.

Review the proposed design as a Principal Architect against the `architecture/*` rules and the
PRD. Think long-term: scalability, maintainability, security, cost.

## Evaluate
- **Fit:** does it serve the PRD goals and respect the core invariants (ledger, tenancy, RBAC,
  API-first, async)? See [CLAUDE.md §8](../CLAUDE.md).
- **Boundaries:** correct module ownership; no cross-boundary coupling; dependency rule honored.
  See [architecture/module-boundaries](../architecture/module-boundaries.md), [dependency-rules](../architecture/dependency-rules.md).
- **Data:** model normalized; embed/reference choices sound; indexes & transactions planned.
- **Failure modes:** retries/idempotency, partial failure, hot tenants, third-party outages.
- **Scalability:** stateless scaling, async offload, read models, pagination, caching.
- **Security & compliance:** isolation, least privilege, auditability by design.
- **Simplicity:** is there a simpler design meeting the same needs (KISS/YAGNI)?

## Output (format)
1. Analysis 2. Architecture Decisions (with trade-offs) 3. Advantages 4. Possible Improvements
(recommend one) 5. Recommended design 6. Risks & mitigations 7. Future scalability.
- Record accepted decisions in [architecture/design-decisions](../architecture/design-decisions.md) (ADR).
