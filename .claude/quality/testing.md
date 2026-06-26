# Testing

> **Status:** 🟡 Seed · **Owner:** QA / Principal Architect · **Related:** [TESTING (docs)](../../docs/README.md) · [code-review](./code-review.md)

## Purpose
Confidence through layered, meaningful tests — not coverage theater.

## Test types (all required)
| Type | Scope | Tooling (proposed) |
|------|-------|--------------------|
| **Unit** | Services/domain logic with fake ports | Vitest/Jest |
| **Integration** | API + DB (test Mongo), repositories, transactions | Jest + Testcontainers/mongodb-memory-server |
| **E2E** | Critical user journeys through the UI | Playwright |
| **Validation** | DTO/Zod schemas accept/reject correctly | Unit |
| **Permission** | RBAC: each role can/can't do each action | Integration |
| **Tenant isolation** | Cross-tenant access is impossible (adversarial) | Integration |

## Rules
- Test **behavior and invariants**, not implementation details.
- Every bug fix adds a regression test.
- Critical inventory flows (receive, adjust, transfer, reserve, fulfill, count) have unit +
  integration tests asserting ledger correctness and `available ≥ 0`.
- Deterministic tests (no real time/network/randomness); seed data via factories.
- CI runs the full suite; coverage tracked with sensible thresholds on core domains.

## Pyramid
Many unit, fewer integration, few high-value E2E. Fast feedback first.
