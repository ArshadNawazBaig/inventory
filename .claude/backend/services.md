# Services (Use Cases)

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [nestjs](./nestjs.md) · [repositories](./repositories.md) · [database/transactions](../database/transactions.md)

## Purpose
Where business logic lives — application/domain services implementing use cases.

## Principles
- A service method = one use case (`ReceivePurchaseOrder`, `AdjustStock`, `CreateSalesOrder`).
- Single Responsibility; small, composable; depends on **ports** (repository/adapter interfaces).
- Pure domain rules in domain services; orchestration + transactions in application services.

## Rules
- Enforce invariants here (e.g., ATP ≥ 0) before persisting.
- Critical stock writes run inside a transaction and post to the immutable ledger
  (see [database/transactions](../database/transactions.md)).
- Side effects (email, webhooks, exports) are emitted as **domain events** → queues, not done inline.
- Idempotency for retriable operations (operation keys).
- No framework or DB types leak into domain logic.
- Return domain results; controllers map to Response DTOs.

## Testing
- Unit-test services against in-memory/fake repositories (ports), covering happy path,
  invariant violations, and permission/tenant edge cases. See [quality/testing](../quality/testing.md).
