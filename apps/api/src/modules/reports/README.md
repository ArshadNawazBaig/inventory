# Reports module (read-only analytics)

Cross-module, read-only aggregations over the inventory projection + catalog. See
[`docs/modules/reports.md`](../../../../../docs/modules/reports.md).

## Reports
- **Inventory valuation** — `GET /api/v1/reports/inventory-valuation?warehouseId?`. Values each (variant ×
  location) cell at its weighted-average cost; rolls up `{ totalUnits, totalValueMinor, variantCount, cellCount }`
  plus a by-warehouse breakdown. Empty cells (onHand 0) don't contribute.
- **Low stock (reorder)** — `GET /api/v1/reports/low-stock`. Reorder-eligible variants (reorderPoint > 0) whose
  on-hand (summed across locations) is at/below the reorder point — **including out-of-stock items** (driven
  from the catalog, not just cells with rows). Most urgent (largest shortfall) first; `suggestedQty =
  max(reorderQty, shortfall)`.

Permission: `report.view`. Tenant-scoped.

## Layout
```
application/    ports, reports.service (the aggregations)
presentation/   dto, report.controller   (the service returns response shapes directly — no mappers)
```

## Dependencies
One-way: Reports → Inventory (`InventoryQuery.listAllLevels`), Catalog (`CatalogQuery.listReorderVariants`),
Locations (`LocationQuery.findWarehouseId` + `getWarehouseLabel`). No writes, no cycles. Ports bound by identity
to those query services.

## Follow-ups
Async generation + **CSV export** (`report.export`) via BullMQ; more reports (stock movement summary, inventory
aging, dead stock, PO/SO summaries); multi-currency valuation; caching/materialized read-models at scale.
