# Dashboard Module (read-only overview)

| Field | Value |
|-------|-------|
| **Document** | Dashboard Design (inventory overview) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/dashboard`](../../apps/api/src/modules/dashboard) · frontend [`apps/web/src/features/dashboard`](../../apps/web/src/features/dashboard) |
| **Phase** | Module design + Backend + Frontend (Wave 7) |
| **Depends on** | [reports.md](./reports.md) (valuation + low-stock) · [purchasing.md](./purchasing.md) · [sales.md](./sales.md) · [transfers.md](./transfers.md) · [inventory.md](./inventory.md) (ledger feed) |
| **Owner** | Principal Architect |

> A read-only **overview** that composes existing read-models into one payload — it owns no collection and
> writes nothing. Computed synchronously. Decisions: **Decision → Why → Rejected**.

---

## 1. Scope & boundary
**Owns:** nothing. **References:** Reports (`inventoryValuation` + `lowStock`), Purchasing/Sales/Transfers
(`*Query.countByStatus`), Inventory (`listRecentMovements`), Catalog (`getVariantSnapshot`) + Locations
(`getLocationLabel`) for feed enrichment. One-way; no writes; no cycles.

---

## 2. The summary
`GET /api/v1/dashboard/summary` returns, in one round-trip:

- **`inventory`** — total stock value (weighted-average), total units, variant count, currency.
- **`counts`** — the KPI tiles: `lowStock`, `openPurchaseOrders`, `openSalesOrders`, `inTransitTransfers`.
  *Open* = the count of orders **not** in a terminal status (PO: `received`/`cancelled`; SO:
  `fulfilled`/`cancelled`). *In transit* = transfers in `in_transit` + `partially_received`.
- **`valuationByWarehouse`** — the by-warehouse breakdown (reused from Reports).
- **`ordersByStatus`** — the complete per-status tally for purchase orders, sales orders, transfers
  (count 0 for absent statuses, so the UI renders a stable breakdown).
- **`topLowStock`** — the 5 most urgent reorder rows (reused from Reports' low-stock).
- **`recentMovements`** — the 8 newest ledger entries, each enriched with the variant sku/name and location
  label for display.

> **Decision** — **reuse `ReportsService`** for valuation + low-stock rather than re-deriving them. **Why** —
> DRY; the aggregation already exists, is tested, and stays the single definition. **Rejected** — duplicating
> the valuation/low-stock math in the dashboard. (Reports now exports its service; the dashboard binds to it by
> identity.)

> **Decision** — counts are sourced from per-module **`*Query.countByStatus`** read services (new), not by
> listing orders. **Why** — a status tally is a cheap, stable read surface that maps directly to a future Mongo
> `$group`; consistent with the existing `InventoryQuery`/`CatalogQuery`/`LocationQuery` pattern. **Rejected** —
> paging every order list to count, or reaching into another module's repository.

> **Decision** — compute **synchronously** in-process. **Why** — correct + shippable on the in-memory adapters;
> the payload is small and bounded. **Rejected** — caching/materialising before there's load to justify it.

---

## 3. API
Base `/api/v1`. `GET /dashboard/summary` (no params). Permission: `dashboard.view`. Tenant-scoped.
`requestId` on every response.

---

## 4. Architecture
`DashboardService` depends on read ports bound by identity to `ReportsService` and the
`PurchasingQuery`/`SalesQuery`/`TransfersQuery`/`InventoryQuery`/`CatalogQuery`/`LocationQuery` services (which
structurally satisfy them). The recent-activity feed is enriched in the service (variant + location lookups,
cached per id) and the service returns the response shape directly (no domain entity, no mappers). Frontend: a
`/dashboard` route with KPI tiles, a value-by-warehouse bar chart (reuses the Reports chart-data mapper), a
"needs reordering" list (links to the full report), and an enriched recent-activity feed.

---

## 5. Testing notes
Service (fakes): inventory headline from valuation; open/in-transit counts derived from breakdowns (terminal
statuses excluded); status breakdowns + top low-stock passthrough; recent-feed enrichment (sku/name + location
label + ISO timestamp; unknown refs degrade to empty/null, never throw); tenant isolation. Contracts: the
summary payload + `StatusCount`; rejects a missing block / unknown movement type / non-integer count. Seams:
`*Query.countByStatus` zero-fills the full status set, tenant-scoped; `InventoryQuery.listRecentMovements` maps
newest-first, tenant-scoped. Frontend: pure formatters (`movementTypeLabel`, `formatDelta`, `humanizeStatus`).

---

## 6. Status
🟢 **Implemented** (Wave 7). Sync `dashboard.view` into AUTHENTICATION §10. Follow-ups: activity feed from the
audit trail (richer than the ledger); per-period trends (movements over time) once the worker is wired;
configurable widgets; summary caching at scale.
