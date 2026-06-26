# Transactions

> **Status:** 🟡 Seed · **Owner:** Database Architect · **Related:** [collections](./collections.md) · [backend/services](../backend/services.md)

## Purpose
Guarantee stock integrity for critical operations using MongoDB multi-document transactions.

## When a transaction is mandatory
Any operation that writes a ledger entry **and** updates a projection or related document:
- Receiving against a PO (movement + PO state + valuation cost).
- Adjustment (movement + stock_level).
- Transfer (out-movement + in-movement + both stock_levels; in-transit state).
- Reservation create/release (reservation + ATP implications).
- Fulfillment/shipping (movement + reservation release + SO state).
- Count approval (reconciling movements + stock_levels).

## Rules
- Wrap the **ledger write + projection update** in a single session/transaction.
- Read current `stock_level` with the session; assert non-negative invariants before commit.
- Make operations **idempotent** (operation key) so retries don't double-post.
- Keep transactions short; do no I/O (email, Cloudinary) inside them — emit events instead.
- Handle `TransientTransactionError` / `WriteConflict` with bounded retries.

## Invariants enforced
- `available = on_hand − reserved ≥ 0`.
- `stock_level.onHand == Σ(stock_movements.delta)` for that (variant, location).
- No negative on-hand unless an explicit "allow negative" tenant setting is enabled.
