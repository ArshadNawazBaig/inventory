# Reports Module (read-only analytics)

| Field | Value |
|-------|-------|
| **Document** | Reports Design (inventory analytics) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/reports`](../../apps/api/src/modules/reports) · frontend [`apps/web/src/features/reports`](../../apps/web/src/features/reports) |
| **Phase** | Module design + Backend + Frontend (Wave 7) |
| **Depends on** | [inventory.md](./inventory.md) (stock projection) · [product.md](./product.md) (reorder points) · [locations.md](./locations.md) (warehouse grouping) |
| **Owner** | Principal Architect |

> Read-only, cross-module aggregations over the inventory projection + catalog. Computed synchronously for now;
> async generation + CSV export via BullMQ is a documented follow-up. Decisions: **Decision → Why → Rejected**.

---

## 1. Scope & boundary
**Owns:** nothing (no collection) — Reports is a pure read/aggregation layer. **References:** Inventory
(`listAllLevels`), Catalog (`listReorderVariants`), Locations (`findWarehouseId` + `getWarehouseLabel`).
One-way; no writes; no cycles.

---

## 2. Reports
**Inventory valuation** — values each (variant × location) cell at its weighted-average cost; rolls up
`{ totalUnits, totalValueMinor, variantCount, cellCount }` + a by-warehouse breakdown (+ the stock currency).
Empty cells (onHand 0) don't contribute. Optional `warehouseId` scope.

**Low stock (reorder)** — reorder-eligible variants (`reorderPoint > 0`) whose on-hand (summed across
locations) is at/below the reorder point, **including out-of-stock items**. Most urgent (largest shortfall)
first; `suggestedQty = max(reorderQty, shortfall)`. Paginated.

> **Decision** — the low-stock report is **catalog-driven, not levels-driven**. **Why** — a levels-driven scan
> would miss variants with *no* stock row at all, i.e. the **out-of-stock** items that are the most urgent
> reorders. **Rejected** — iterating only existing stock cells. (This drove the `CatalogQuery.listReorderVariants`
> + `VariantRepository.listAll` seam additions.)

> **Decision** — compute **synchronously** in-process this wave. **Why** — correct + shippable on the in-memory
> adapters; the data volumes are small. **Rejected** — building the BullMQ pipeline before the worker is wired.
> **Follow-up (ADR-026)** — async generation + **CSV export** (`report.export`); caching/materialized
> read-models at scale.

---

## 3. API
Base `/api/v1`. `GET /reports/inventory-valuation?warehouseId?` · `GET /reports/low-stock?page&limit`.
Permission: `report.view`. Tenant-scoped. `requestId` on every response.

---

## 4. Architecture
`ReportsService` depends on `InventoryReadPort`/`CatalogReadPort`/`LocationReadPort`, bound by identity to
`InventoryQuery`/`CatalogQuery`/`LocationQuery` (which structurally satisfy them). The service returns
response-shaped objects directly (reports have no domain entity, so no mappers). Frontend: a `/reports` page
with **Valuation** (KPI cards + a by-warehouse bar chart [Recharts] + breakdown table) and **Low stock**
(reorder table with out-of-stock/low badges) tabs.

---

## 5. Testing notes
Service (fakes): valuation weighted-average totals, by-warehouse breakdown (empty cells excluded), warehouse
filter, tenant isolation; low-stock includes out-of-stock, excludes healthy, most-urgent-first ordering,
suggested-qty math, pagination, tenant isolation. Contracts: query defaults/strict + response payloads.
Frontend: chart-data mapper (minor→major, unnamed → “Unassigned”).

---

## 6. Status
🟢 **Implemented** (Wave 7). Sync `report.{view,export}` into AUTHENTICATION §10. Follow-ups in §2 (async +
CSV export; more reports — movement summary, inventory aging, dead stock, PO/SO summaries; multi-currency;
caching).
