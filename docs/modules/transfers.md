# Transfers Module (inter-location stock moves)

| Field | Value |
|-------|-------|
| **Document** | Transfers Design (inter-location moves) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/transfers`](../../apps/api/src/modules/transfers) · frontend [`apps/web/src/features/transfers`](../../apps/web/src/features/transfers) |
| **Phase** | Module design + Backend + Frontend (Wave 6) |
| **Depends on** | [product.md](./product.md) (variants) · [locations.md](./locations.md) (source/destination) · [inventory.md](./inventory.md) (the two legs) · DATABASE §9 |
| **Owner** | Backend Lead / Principal Architect |

> Move stock between two locations in two legs. **Dispatch posts `transfer_out`** at the source; **receive
> posts `transfer_in`** at the destination (carrying the source's valuation so cost moves with the goods).
> Decisions: **Decision → Why → Rejected**.

---

## 1. Scope & boundary
**Owns:** `transfers` (header + embedded lines). **References:** Catalog (variants), Locations
(source/destination). Does **not** write the ledger itself — it asks Inventory to (`transferOut`/`transferIn`).

---

## 2. Entity
`TransferEntity`: `transferNumber` (per-tenant `TR-0001` sequence), `sourceLocationId` + `sourceLocationName`
snapshot, `destinationLocationId` + `destinationLocationName` snapshot, `status`, `note?`, embedded `lines`,
audit. **Line:** `{ variantId, skuSnapshot, nameSnapshot, quantity, dispatchedQty, receivedQty, unitCostMinor,
currency }` — `unitCostMinor`/`currency` are captured from the source's running average **at dispatch** (null
until then). No money is user-entered; a transfer has no order value.

> **Decision** — lines are **embedded** and **snapshot** sku/name at order time (same rationale as Purchasing
> §2). **Why** — historical accuracy. **Rejected** — a separate lines collection; referencing live catalog.

---

## 3. DTOs
Zod in `packages/types` (`transfers.ts`), `.strict()`. `CreateTransferRequest` ({ sourceLocationId,
destinationLocationId (≠ source), note?, lines[{variantId, quantity}] }); `Update…` (draft only; may repoint
source/destination); `ReceiveTransferRequest` ({ lines[{lineId, quantity}] } — **no location**, the
destination is fixed on the transfer); `TransferResponse` (detail w/ lines), `TransferSummary` (list,
`lineCount`).

---

## 4. Lifecycle & rules
`draft → in_transit → partially_received → completed`; `cancel` from **draft only** (dispatched stock must be
received to reconcile).
- Source ≠ destination (422); both locations live (422); each line variant live (422).
- **dispatch** — from draft; posts a `transfer_out` per line from the source (**negative-guarded** → 409 on
  insufficient stock), captures the source average onto each line, sets `dispatchedQty`, goes `in_transit`.
  Idempotent on `opKey = transfer:{id}:{lineId}:out`.
- **receive** — per line `quantity ≤ dispatchedQty − receivedQty` (409); posts a `transfer_in` per line into
  the destination **at the captured cost** via `InventoryService.transferIn`; advances `receivedQty`; status →
  `completed` when all received, else `partially_received`. Idempotent on
  `opKey = transfer:{id}:{lineId}:in:{newReceivedQty}`.

> **Decision** — **in-transit stock is not counted on-hand** at either location this wave. **Why** — a virtual
> in-transit location / `stock_levels.inTransit` upkeep is a separable iteration; the per-transfer
> `dispatchedQty − receivedQty` is authoritative meanwhile. **Rejected** — half-building an in-transit
> projection. **Follow-up** — maintain `stock_levels.inTransit`.

> **Transaction boundary (DATABASE §11):** each leg posts movement(s) + updates the transfer. In-memory these
> are sequential (validated before posting); the Mongoose adapter wraps them in a session.

---

## 5. API
Base `/api/v1`. `GET /transfers` · `POST /transfers` (201) · `GET|PATCH /transfers/:id` ·
`POST /transfers/:id/{dispatch,receive,cancel}` (200). Permissions: `transfer.{view,manage}`. Errors:
`VALIDATION_ERROR` 400/422 · `CONFLICT` 409 (state / over-receive / insufficient stock at dispatch) · 404
(incl. cross-tenant). `requestId` on every response.

---

## 6. Architecture
Ports-and-adapters; `TransfersService` depends on `CatalogRef`/`LocationRef`/`StockMover` ports, bound to
`CatalogQuery`/`LocationQuery`/`InventoryService` (one-way; no cycles). `StockMover.transferOut` returns the
source's captured valuation so `transferIn` lands it at the destination. Frontend: list + create (source/dest
`LocationPicker` + dynamic line editor) + detail with dispatch (confirm) and receive (per-line) dialogs;
reuses the shared `OrderStatusBadge` and Inventory's cascading `LocationPicker`.

---

## 7. Testing notes
Service (fakes + in-memory repo): create with snapshots/labels/sequence; same-location 422; invalid
location/variant; dispatch posts `transfer_out` capturing cost + deterministic opKeys; dispatch-only-from-draft
guard; partial→full receive posting `transfer_in` at captured cost; over-receive 409; receive-before-dispatch
409; cancel rules; tenant isolation. Contracts: strict fields, ≠ locations, ≥1 line, positive quantities.

---

## 8. Status
🟢 **Implemented** (Wave 6). Sync `transfer.{view,manage}` into AUTHENTICATION §10. Follow-ups: `inTransit`
projection upkeep; cancel/return of dispatched stock; edit-draft UI; Mongoose adapters + `counters` sequence.
