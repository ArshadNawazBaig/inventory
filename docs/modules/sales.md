# Sales Module (Sales Orders)

| Field | Value |
|-------|-------|
| **Document** | Sales Design (outbound orders) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/sales`](../../apps/api/src/modules/sales) · frontend [`apps/web/src/features/sales`](../../apps/web/src/features/sales) |
| **Phase** | Module design + Backend + Frontend (Wave 5) |
| **Depends on** | [parties.md](./parties.md) (customer) · [product.md](./product.md) (variants) · [locations.md](./locations.md) · [inventory.md](./inventory.md) (shipments) · DATABASE §8 |
| **Owner** | Backend Lead / Principal Architect |

> Outbound orders to customers. **Fulfilling posts `shipment` movements** out of Inventory (the only way
> stock leaves from an SO; negative-guarded). Decisions: **Decision → Why → Rejected**.

---

## 1. Scope & boundary
**Owns:** `sales_orders` (header + embedded lines). **References:** Parties (customer), Catalog (variants),
Locations (warehouse/location), Inventory (posts shipments). Does **not** write the ledger itself.

---

## 2. Entity
`SalesOrderEntity`: `soNumber` (per-tenant `SO-0001` sequence), `customerId` + `customerName` snapshot,
`warehouseId` (fulfilment site), `currency`, `status`, `note?`, embedded `lines`, denormalized `totals`,
audit. **Line:** `{ variantId, skuSnapshot, nameSnapshot, orderedQty, shippedQty, unitPriceMinor }` (embedded
snapshots — same rationale as Purchasing §2).

---

## 3. DTOs
Zod in `packages/types` (`sales.ts`), `.strict()`. `CreateSalesOrderRequest` (customer, warehouse, currency,
note?, lines[{variantId, orderedQty, unitPriceMinor}]); `Update…` (draft only; customer fixed);
`FulfillSalesOrderRequest` ({ locationId, lines[{lineId, quantity}] }); `SalesOrderResponse` (detail),
`SalesOrderSummary` (list).

---

## 4. Lifecycle & rules
`draft → confirmed → partially_fulfilled → fulfilled`; `cancel` from draft/confirmed.
- Customer + warehouse live (422); each line variant live (422).
- **confirm** locks the order; only drafts are editable.
- **fulfill** — location must be in the fulfilment warehouse (422); per line `quantity ≤ outstanding` (409);
  pre-checks all lines, then posts a `shipment` movement per line (**negative-guarded** by Inventory →
  insufficient stock is 409, no line advanced) via `InventoryService.ship`; advances `shippedQty`; status →
  `fulfilled` when all lines complete, else `partially_fulfilled`. **Idempotent** on
  `opKey = so:{id}:{lineId}:{newShippedQty}`.

> **Decision** — confirm does **not** reserve stock this wave; the ledger + negative guard at ship time
> prevent overselling physical stock. **Why** — ATP reservations need an allocation decision (which
> location/bin) and a reservation lifecycle; that's a separable iteration. **Rejected** — half-building
> reservations. **Follow-up (ADR-021)** — `reservations` on confirm (reduce `available`), released on
> ship/cancel.

---

## 5. API
Base `/api/v1`. `GET /sales-orders` · `POST /sales-orders` (201) · `GET|PATCH /sales-orders/:id` ·
`POST /sales-orders/:id/{confirm,fulfill,cancel}` (200). Permissions: `sales_order.{view,manage}`. Errors:
`VALIDATION_ERROR` 400/422 · `CONFLICT` 409 (state / over-fulfil / insufficient stock) · 404. `requestId`
on every response.

---

## 6. Architecture
Ports-and-adapters; `SalesService` depends on `CatalogRef`/`CustomerRef`/`WarehouseLocationRef`/
`ShipmentPoster` ports, bound to `CatalogQuery`/`PartyQuery`/`LocationQuery`/`InventoryService` (one-way; no
cycles). Reuses the shared `features/orders` `OrderForm` + `OrderStatusBadge`. Frontend: list + create +
detail with a fulfil dialog (location + per-line quantities).

---

## 7. Testing notes
Service (fakes + in-memory repo): create with snapshots/totals/sequence; invalid customer/warehouse/variant;
confirm guard; partial→full fulfil posting shipments with deterministic opKeys; over-fulfil 409;
foreign-location 422; fulfil-draft 409; **Inventory rejection propagates without advancing the line**; cancel
rules; tenant isolation. Contracts: strict fields, currency, ≥1 line, positive quantities.

---

## 8. Status
🟢 **Implemented** (Wave 5). Sync `sales_order.{view,manage}` into AUTHENTICATION §10. Follow-ups: **ATP
reservations** on confirm (ADR-021); edit-draft UI; backorders/allocation; customer returns (`return_in`);
discounts/tax; Mongoose adapters + `counters` sequence.
