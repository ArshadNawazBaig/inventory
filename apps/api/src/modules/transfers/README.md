# Transfers module (inter-location stock moves)

Move stock between two locations in two legs. **Dispatch posts `transfer_out`** at the source; **receive
posts `transfer_in`** at the destination, carrying the source's valuation so cost moves with the goods. See
[`docs/modules/transfers.md`](../../../../../docs/modules/transfers.md) and DATABASE §9.

## Lifecycle
`draft → in_transit → partially_received → completed`; `cancel` from draft only.
- **draft** — freely editable (source/destination + line set replaced on update).
- **dispatch** — posts a `transfer_out` per line from the source (negative-guarded), captures the source's
  running average onto each line, goes `in_transit`. Idempotent on `opKey = transfer:{id}:{lineId}:out`.
- **receive** — per-line quantities into the (fixed) destination; posts a `transfer_in` per line **at the
  captured cost**, advances `receivedQty`, recomputes status. Idempotent on
  `opKey = transfer:{id}:{lineId}:in:{newReceivedQty}`.

## Rules
- Tenant-scoped on every read/write; cross-tenant → 404.
- Source ≠ destination (422); both locations must be live (422); each line's variant must be live (422).
- Lines embed **snapshots** of sku/name at order time (historical accuracy).
- Can't receive more than the in-transit (dispatched-not-received) quantity (409); can only receive an
  in-transit transfer (409). Stock in transit is not on-hand at either location (a follow-up may track an
  `inTransit` projection).

## Layout
```
domain/         entities (transfer + embedded lines), transfers.errors
application/    ports, transfers.service
infrastructure/ in-memory.repository (TR-#### sequence), adapters (Inventory stock mover)
presentation/   dto, mappers, transfer.controller
```

## Dependencies
One-way: Transfers → Catalog (`getVariantSnapshot`), Locations (`LocationQuery`), Inventory
(`InventoryService.transferOut/transferIn`). No cycles.

## Permissions
`transfer.{view,manage}` — sync into AUTHENTICATION §10.
