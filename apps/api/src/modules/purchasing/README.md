# Purchasing module (Purchase Orders)

Inbound orders to suppliers. **Receiving posts `receipt` movements** into Inventory (the only way stock
enters from a PO), driving weighted-average cost. See
[`docs/modules/purchasing.md`](../../../../../docs/modules/purchasing.md) and DATABASE §7.

## Lifecycle
`draft → submitted → partially_received → received`; `cancel` from draft/submitted.
- **draft** — freely editable (header + line set replaced on update).
- **submit** — locks the order.
- **receive** — per-line quantities into a chosen location; posts a `receipt` movement per line (costed),
  advances `receivedQty`, recomputes status. Idempotent on `opKey = po:{id}:{lineId}:{newReceivedQty}`.

## Rules
- Tenant-scoped on every read/write; cross-tenant → 404.
- Supplier + warehouse must be live (422); each line's variant must be live (422).
- Lines embed **snapshots** of sku/name at order time (historical accuracy); totals denormalized.
- Receive location must be in the PO's receiving warehouse (422); can't over-receive a line (409); can only
  receive a submitted order (409).

## Layout
```
domain/         entities (order + embedded lines), purchasing.errors
application/    ports, purchasing.service
infrastructure/ in-memory.repository (PO-#### sequence), adapters (Inventory receipt poster)
presentation/   dto, mappers, purchase-order.controller
```

## Dependencies
One-way: Purchasing → Catalog (`getVariantSnapshot`), Parties (`PartyQuery`), Locations (`LocationQuery`),
Inventory (`InventoryService.receive`). No cycles.

## Permissions
`purchase_order.{view,manage}` — sync into AUTHENTICATION §10.
