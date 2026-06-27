# Dashboard module (read-only overview)

Composes existing read-models into a single overview payload. See
[`docs/modules/dashboard.md`](../../../../../docs/modules/dashboard.md).

## Endpoint
- **Summary** — `GET /api/v1/dashboard/summary`. One round-trip returning:
  - `inventory` — total stock value (weighted-average), total units, variant count, currency.
  - `counts` — KPI tiles: `lowStock`, `openPurchaseOrders`, `openSalesOrders`, `inTransitTransfers`
    (open = non-terminal statuses; in-transit = `in_transit` + `partially_received`).
  - `valuationByWarehouse` — the by-warehouse breakdown (reused from Reports).
  - `ordersByStatus` — the full per-status tally for purchase orders, sales orders, transfers.
  - `topLowStock` — the 5 most urgent reorder rows (reused from Reports).
  - `recentMovements` — the 8 newest ledger entries, enriched with sku/name + location label.

Permission: `dashboard.view`. Tenant-scoped.

## Layout
```
application/    ports, dashboard.service (the composition)
presentation/   dashboard.controller     (the service returns the response shape directly — no mappers)
```

## Dependencies
One-way, no writes, no cycles. Bound by identity to other modules' read services:
Reports (`ReportsService.inventoryValuation` + `lowStock` — reused, not re-derived), Purchasing/Sales/Transfers
(`*Query.countByStatus`), Inventory (`InventoryQuery.listRecentMovements`), Catalog
(`CatalogQuery.getVariantSnapshot`) and Locations (`LocationQuery.getLocationLabel`) for feed enrichment.

## Follow-ups
Activity feed from the audit trail (richer than the ledger); per-period trends (movements over time) once the
worker is wired; configurable widgets; caching the summary at scale. Permission key `dashboard.view` to sync
into AUTHENTICATION §10.
