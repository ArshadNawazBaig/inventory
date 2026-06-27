# Purchasing Module (Purchase Orders)

| Field | Value |
|-------|-------|
| **Document** | Purchasing Design (inbound orders) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/purchasing`](../../apps/api/src/modules/purchasing) · frontend [`apps/web/src/features/purchasing`](../../apps/web/src/features/purchasing) |
| **Phase** | Module design + Backend + Frontend (Wave 5) |
| **Depends on** | [parties.md](./parties.md) (supplier) · [product.md](./product.md) (variants) · [locations.md](./locations.md) · [inventory.md](./inventory.md) (receipts) · DATABASE §7 |
| **Owner** | Backend Lead / Principal Architect |

> Inbound orders to suppliers. **Receiving posts `receipt` movements** into Inventory (the only way stock
> enters from a PO), driving weighted-average cost. Decisions: **Decision → Why → Rejected**.

---

## 1. Scope & boundary
**Owns:** `purchase_orders` (header + embedded lines). **References:** Parties (supplier), Catalog
(variants), Locations (warehouse/location), Inventory (posts receipts). Does **not** write the ledger
itself — it asks Inventory to.

---

## 2. Entity
`PurchaseOrderEntity`: `poNumber` (per-tenant `PO-0001` sequence), `supplierId` + `supplierName` snapshot,
`warehouseId` (receiving site), `currency`, `status`, `expectedAt?`, `note?`, embedded `lines`, denormalized
`totals`, audit. **Line:** `{ variantId, skuSnapshot, nameSnapshot, orderedQty, receivedQty, unitCostMinor }`.

> **Decision** — lines are **embedded** and **snapshot** sku/name at order time. **Why** — lines are owned
> by and read with their order; snapshots preserve historical accuracy (renaming a product must not rewrite
> a closed PO). **Rejected** — a separate lines collection; referencing live catalog values.

---

## 3. DTOs
Zod in `packages/types` (`purchasing.ts`), `.strict()`. `CreatePurchaseOrderRequest` (supplier, warehouse,
currency, expectedAt?, note?, lines[{variantId, orderedQty, unitCostMinor}]); `Update…` (draft only; supplier
fixed); `ReceivePurchaseOrderRequest` ({ locationId, lines[{lineId, quantity}] }); `PurchaseOrderResponse`
(detail w/ lines), `PurchaseOrderSummary` (list, `lineCount`).

---

## 4. Lifecycle & rules
`draft → submitted → partially_received → received`; `cancel` from draft/submitted.
- Supplier + warehouse live (422); each line variant live (422).
- **submit** locks the order; only drafts are editable.
- **receive** — location must be in the receiving warehouse (422); per line `quantity ≤ outstanding` (409);
  posts a `receipt` movement per line (costed → weighted-average) via `InventoryService.receive`; advances
  `receivedQty`; status → `received` when all lines complete, else `partially_received`. **Idempotent** on
  `opKey = po:{id}:{lineId}:{newReceivedQty}` (a retried receive never double-posts).

> **Transaction boundary (DATABASE §11):** receiving posts movement(s) + updates the PO. In-memory these are
> sequential (validated before posting); the Mongoose adapter wraps them in a session.

---

## 5. API
Base `/api/v1`. `GET /purchase-orders` · `POST /purchase-orders` (201) · `GET|PATCH /purchase-orders/:id` ·
`POST /purchase-orders/:id/{submit,receive,cancel}` (200). Permissions: `purchase_order.{view,manage}`.
Errors: `VALIDATION_ERROR` 400/422 · `CONFLICT` 409 (state / over-receive / insufficient stock from
Inventory) · 404 (incl. cross-tenant). `requestId` on every response.

---

## 6. Architecture
Ports-and-adapters; `PurchasingService` depends on `CatalogRef`/`SupplierRef`/`WarehouseLocationRef`/
`ReceiptPoster` ports, bound to `CatalogQuery`/`PartyQuery`/`LocationQuery`/`InventoryService` (one-way; no
cycles). In-memory repo until the DB module. Frontend: list + create (shared `OrderForm`) + detail with a
receive dialog (location + per-line quantities). The shared order form/status-badge live in
`features/orders` (reused by Sales).

---

## 7. Testing notes
Service (fakes + in-memory repo): create with snapshots/totals/sequence; invalid supplier/warehouse/variant;
submit guard; draft-only edit; partial→full receive posting costed receipts with deterministic opKeys;
over-receive 409; foreign-location 422; receive-draft 409; cancel rules; tenant isolation. Contracts: strict
fields, currency/date, ≥1 line, positive quantities.

---

## 8. Status
🟢 **Implemented** (Wave 5). Sync `purchase_order.{view,manage}` into AUTHENTICATION §10. Follow-ups: PO
approval step + `closed`; edit-draft UI; returns to supplier (`return_out`); landed-cost/tax; supplier-price
defaults; Mongoose adapters + `counters` sequence.
