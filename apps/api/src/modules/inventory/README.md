# Inventory module (the keystone)

Owns the **immutable stock ledger** (`stock_movements`) and the **on-hand projection**
(`stock_levels`). This is the only module allowed to write the ledger. See
[`docs/modules/inventory.md`](../../../../../docs/modules/inventory.md), DATABASE §6 and §11
(transactions), ADR-002.

## Invariants
- **Ledger is the source of truth.** Movements are append-only — never updated, never deleted.
- **`onHand ≡ Σ(delta)`** for a (variant, location); the projection is recomputed in the **same unit of
  work** as the ledger write (the transaction boundary; Mongoose wraps it in a session later).
- **`available = onHand − reserved`** — persisted for indexable low-stock queries.
- **No negative on-hand** unless the tenant policy allows it (stub disallows; Settings module wires it).
- **Idempotent** on `opKey` — re-posting the same key returns the original movement (no double-post).
- Weighted-average `avgCostMinor` recomputed on each costed inbound delta.

## Surface
- `GET /api/v1/inventory/levels` — the projection (filter by variant/location).
- `GET /api/v1/inventory/movements` — the ledger history (newest first).
- `POST /api/v1/inventory/adjustments` — post a manual adjustment (`type=adjustment`, `reason.kind=manual`);
  returns `{ movement, level }`. Receipt/shipment/transfer/count movements are posted by their owning
  modules (PO · SO · Transfers · Counts) via the same service in later waves.

## Layout
```
domain/         entities (movement · level · summary · event), inventory.errors
application/    ports, inventory.service (writes), inventory-query.service (read-model, exported)
infrastructure/ in-memory.repositories, adapters (reference → Catalog+Locations, policy, events)
presentation/   dto, mappers, inventory.controller
```

## Dependencies
One-way: Inventory → **Catalog** (`CatalogQuery.variantExists`) and Inventory → **Locations**
(`LocationQuery.locationExists`). Exports `InventoryQuery` (the `getVariantStockSummary` read-model). It is
**not** synchronously wired into Catalog's variant-delete guard — that would create a Catalog ↔ Inventory
cycle (dependency-rules: no circular deps); the proper integration is event/read-model driven (ADR-019).

## Permissions
`inventory.view`, `inventory.adjust` — sync into AUTHENTICATION §10.
