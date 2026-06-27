# Returns module (customer + supplier returns)

`kind`-discriminated returns. A **customer** return brings stock back in (**complete posts `return_in`**); a
**supplier** return sends stock back out (**complete posts `return_out`**, negative-guarded). See
[`docs/modules/returns.md`](../../../../../docs/modules/returns.md) and DATABASE §10.

## Lifecycle
`draft → completed`; `cancel` from draft only.
- **draft** — freely editable (location/reason/note + line set replaced on update; kind + party fixed).
- **complete** — posts one return movement per line (`return_in` for `customer`, `return_out` for `supplier`)
  into the return's location and locks the document. Idempotent on `opKey = return:{id}:{lineId}`.

## Rules
- Tenant-scoped on every read/write; cross-tenant → 404.
- Party must be live for its kind — customer for `customer`, supplier for `supplier` (422); location must be
  live (422); each line's variant must be live (422).
- Lines embed **snapshots** of sku/name at creation (historical accuracy).
- Supplier returns are negative-guarded by Inventory — insufficient stock at the location is a 409.

## Layout
```
domain/         entities (return + embedded lines), returns.errors
application/    ports, returns.service
infrastructure/ in-memory.repository (RET-#### sequence), adapters (Inventory return poster)
presentation/   dto, mappers, return.controller
```

## Dependencies
One-way: Returns → Catalog (`getVariantSnapshot`), Parties (`PartyQuery`), Locations (`LocationQuery`),
Inventory (`InventoryService.returnInbound/returnOutbound`). No cycles.

## Permissions
`return.{view,manage}` — sync into AUTHENTICATION §10.
