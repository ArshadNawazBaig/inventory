# Prompt: Write Tests

> **Status:** 🟡 Seed · **Owner:** Eng · **Use:** adding/raising test coverage.

Write meaningful tests per [quality/testing](../quality/testing.md). Test behavior and
invariants, not implementation details.

## Decide the layer
- **Unit** — service/domain logic with fake ports.
- **Integration** — API + test Mongo/Redis, repositories, transactions.
- **Permission** — each role can/can't perform each action.
- **Tenant isolation** — adversarial cross-tenant access must fail (404/403, no leak).
- **Validation** — DTO/Zod accepts valid, rejects invalid.
- **E2E** — only for critical user journeys.

## Must cover for inventory features
- Ledger correctness (on-hand == Σ movements), `available = onHand − reserved ≥ 0`.
- Transaction atomicity and idempotency (retry doesn't double-post).
- State transitions (PO/SO lifecycle) — valid and invalid.

## Rules
- Deterministic: no real time/network/randomness; use factories/fixtures + seeded data.
- Each bug fix gets a regression test.
- Clear arrange/act/assert; descriptive test names stating the expected behavior.

## Output
The test files + a short note on what's covered and any gaps left (with reasons).
