# Inventory Module (the keystone)

| Field | Value |
|-------|-------|
| **Document** | Inventory Design (stock ledger · levels · adjustments) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/inventory`](../../apps/api/src/modules/inventory) · frontend [`apps/web/src/features/inventory`](../../apps/web/src/features/inventory) |
| **Phase** | Module design + Backend + Frontend (Wave 4) |
| **Depends on** | [product.md](./product.md) (variants) · [locations.md](./locations.md) (locations) · DATABASE §6, §11 · ADR-002 |
| **Owner** | Backend Lead / Principal Architect |

> **Stock accuracy is the product.** The immutable **ledger** (`stock_movements`) is the single source of
> truth; **stock levels** are a persisted, reconcilable projection. Only this module writes the ledger.
> Decisions: **Decision → Why → Rejected**.

---

## 1. Scope & boundary

**Owns:** `stock_movements` (append-only ledger), `stock_levels` (on-hand projection). **References:**
Catalog (`variantId`) and Locations (`locationId`). **Referenced by (later):** Purchasing (receipts),
Sales (shipments + reservations), Transfers, Counts, Returns, Reports — all post movements through this
module's service. Reservations (`reserved`/`available`) are modelled now; **creating** holds arrives with
Sales.

> **Decision** — one module owns all ledger writes; other modules post movements through it, never directly.
> **Why** — the invariant `onHand == Σ delta` and the negative-stock policy must live in exactly one place.
> **Rejected** — each module writing its own movements (the invariant would erode immediately).

---

## 2. Entities

**`StockMovementEntity`** — append-only; **never updated, never deleted**.

| Field | Type | Notes / invariant |
|-------|------|-------------------|
| `variantId`, `locationId` | `objectId` | The stock cell. |
| `delta` | `int` (signed) | **The only thing that moves on-hand.** |
| `type` | `enum` | `receipt · shipment · adjustment · transfer_out · transfer_in · count_adjustment · return_in · return_out · scrap`. Manual writes use `adjustment`. |
| `reason` | `{ kind, refId, lineId }` | `kind ∈ purchase_order · sales_order · transfer · count · manual`; links back to the source doc. |
| `unitCostMinor`, `currency` | `Money \| null` | Inbound cost (drives weighted-average). |
| `opKey` | `string` | **Idempotency key** — unique per tenant. |
| `note` | `string \| null` | Optional human reason. |
| `createdAt`, `createdBy` | — | **No `updatedAt`/`deletedAt`.** |

**`StockLevelEntity`** — one row per (variant × location); derived, reconcilable.

| Field | Type | Notes / invariant |
|-------|------|-------------------|
| `onHand` | `int` | `≡ Σ(delta)` for the cell. |
| `reserved` | `int` | `≡ Σ(active reservations)`; 0 until Sales lands. |
| `available` | `int` | **Persisted** `= onHand − reserved` (indexable low-stock queries). |
| `inTransit` | `int` | Incoming via open transfers (0 until Transfers). |
| `avgCostMinor`, `currency` | `Money \| null` | Weighted-average, recomputed on each costed inbound delta. |
| `lastMovementAt` | `Date \| null` | Staleness/reporting. |

---

## 3. DTOs

Zod in `packages/types` (`inventory.ts`). Requests `.strict()`; responses explicit allow-lists.

| DTO | Key fields |
|-----|-----------|
| `CreateAdjustmentRequest` | `variantId`, `locationId`, `delta (int)`, `note?`, `unitCostMinor?`, `currency?`, `opKey?` |
| `AdjustmentResult` | `{ movement, level }` — the appended entry + the resulting projection (one round-trip) |
| `StockLevelResponse` | the level allow-list (`onHand/reserved/available/inTransit/avgCostMinor/…`) |
| `StockMovementResponse` | the movement allow-list (`delta/type/reason/unitCostMinor/opKey/…`) |
| `StockLevelListQuery` / `StockMovementListQuery` | page/limit/sort + `variantId?`/`locationId?` (+ movement `type?`) |

---

## 4. Validation & invariants

1. **Transport (Zod):** 24-hex references, integer delta, ISO-4217 currency, `.strict()`.
2. **Domain (service):**
   - `delta != 0` → else 400; variant + location must be live → 422.
   - **No negative on-hand** unless the tenant policy allows it → 409 `CONFLICT`.
   - **Idempotent** on `opKey` — re-posting returns the original movement (no double-post).
   - **`onHand = prev + delta`**; `available = onHand − reserved`; weighted-average `avgCost` on costed
     inbound deltas.
3. **Transaction boundary (DATABASE §11):** the ledger append + projection upsert are one unit of work
   (the Mongoose adapter wraps them in a session; the in-memory adapter does both atomically). Reconcilable:
   `onHand == Σ delta` is independently checkable from the ledger.
4. **Output:** explicit mapper. All tenant-scoped; cross-tenant id → not-found / empty.

---

## 5. API

Base `/api/v1`.

| Method | Path | Permission | Success |
|--------|------|-----------|---------|
| GET | `/inventory/levels` | `inventory.view` | 200 (filter `variantId`/`locationId`) |
| GET | `/inventory/movements` | `inventory.view` | 200 (ledger; newest first; filter `variantId`/`locationId`/`type`) |
| POST | `/inventory/adjustments` | `inventory.adjust` | 201 `{ movement, level }` |

Errors: `VALIDATION_ERROR` 400/422 · `UNAUTHORIZED` 401 · `CONFLICT` 409 (insufficient stock). Every
response carries `requestId`.

---

## 6. Permissions

| Permission | Grants | Default system roles |
|-----------|--------|----------------------|
| `inventory.view` | read levels + movements | Owner, Admin, Warehouse Mgr, Operator |
| `inventory.adjust` | post manual adjustments | Owner, Admin, Warehouse Mgr |

> **Action:** sync these two keys into AUTHENTICATION §10 on approval. Receiving/shipping permissions
> arrive with Purchasing/Sales.

---

## 7. Workflow

A manual **adjustment** appends one `adjustment` movement (`reason.kind = manual`) and recomputes the cell's
projection atomically. Receipt/shipment/transfer/count/return movements are posted by their owning modules
through the **same service** in later waves (the only ledger writer). The ledger is never edited — a mistake
is corrected by posting a compensating movement, preserving the audit trail.

---

## 8. Architecture

Ports-and-adapters. `InventoryService` holds the write use case (validate refs → check policy → append
ledger + upsert projection in one unit of work → emit event); in-memory repos until the DB module
(Mongoose wraps the unit of work in a session). Dependencies are **one-way**: Inventory → Catalog
(`CatalogQuery.variantExists`) and Inventory → Locations (`LocationQuery.locationExists`). The module exports
`InventoryQuery` (the `getVariantStockSummary` read-model).

> **Decision** — Inventory does **not** synchronously wire its read-model into Catalog's variant-delete
> guard. **Why** — Catalog already reads `InventoryQueryPort` for that guard; importing Inventory into
> Catalog while Inventory imports Catalog would create a **circular module dependency** (dependency-rules
> forbids cycles; enforced in CI). **Rejected** — `forwardRef` (still a cycle madge flags). **Follow-up** —
> integrate via a **domain event / shared read model** (dependency-rules: "modules talk through public
> interfaces or domain events"); until then Product keeps `StubInventoryQuery` (the variant-delete guard
> sees zero stock).

Frontend: an Inventory page selects a Product → Variant, then shows that variant's **levels** and
**movements** in tabs, with an **Adjust stock** dialog (variant + location pickers, signed delta, optional
inbound cost). Location ids are resolved to `warehouse · path` labels client-side.

---

## 9. Testing notes

- **Service (in-memory repos + fakes):** append + projection (`onHand = delta`); accumulation +
  reconciliation (`onHand == Σ delta`, ledger append-only); zero-delta 400; invalid variant/location 422;
  negative guard (409, and allowed under policy); idempotency on `opKey` (no double-post); weighted-average
  cost; tenant isolation; filtered list. Read-model aggregation across locations.
- **Contracts:** strict unknown-field rejection; 24-hex refs; integer delta; currency; list defaults.

---

## 10. Status

🟢 **Implemented** (Wave 4). Sync two permission keys into AUTHENTICATION §10. Follow-ups: reservation
create/release + shipment posting (Sales); receipts with PO cost (Purchasing); transfers `inTransit` legs;
count approval; event/read-model integration of the Catalog variant-delete guard (avoids the cycle);
tenant `allowNegativeStock` from Settings; Mongoose adapters + reconciliation job; zero/three-decimal
currency handling.
