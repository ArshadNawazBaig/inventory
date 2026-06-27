# Sales module (Sales Orders)

Outbound orders to customers. **Fulfilling posts `shipment` movements** out of Inventory (the only way
stock leaves from an SO; negative-guarded). See
[`docs/modules/sales.md`](../../../../../docs/modules/sales.md) and DATABASE §8.

## Lifecycle
`draft → confirmed → partially_fulfilled → fulfilled`; `cancel` from draft/confirmed.
- **draft** — freely editable (header + line set replaced on update).
- **confirm** — locks the order. (ATP reservations on confirm are a documented follow-up — ADR-021.)
- **fulfill** — per-line quantities out of a chosen location; pre-checks all lines, then posts a `shipment`
  movement per line (negative-guarded by Inventory), advances `shippedQty`, recomputes status. Idempotent
  on `opKey = so:{id}:{lineId}:{newShippedQty}`.

## Rules
- Tenant-scoped on every read/write; cross-tenant → 404.
- Customer + warehouse must be live (422); each line's variant must be live (422).
- Lines embed **snapshots** of sku/name + price at order time; totals denormalized.
- Fulfil location must be in the SO's fulfilment warehouse (422); can't over-fulfil a line (409); can only
  fulfil a confirmed order (409). Insufficient stock surfaces from Inventory as 409 (no line advanced).

## Layout
```
domain/         entities (order + embedded lines), sales.errors
application/    ports, sales.service
infrastructure/ in-memory.repository (SO-#### sequence), adapters (Inventory shipment poster)
presentation/   dto, mappers, sales-order.controller
```

## Dependencies
One-way: Sales → Catalog (`getVariantSnapshot`), Parties (`PartyQuery`), Locations (`LocationQuery`),
Inventory (`InventoryService.ship`). No cycles.

## Permissions
`sales_order.{view,manage}` — sync into AUTHENTICATION §10.
