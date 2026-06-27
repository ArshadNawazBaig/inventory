# Returns Module (customer + supplier returns)

| Field | Value |
|-------|-------|
| **Document** | Returns Design (inbound + outbound returns) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/returns`](../../apps/api/src/modules/returns) · frontend [`apps/web/src/features/returns`](../../apps/web/src/features/returns) |
| **Phase** | Module design + Backend + Frontend (Wave 6) |
| **Depends on** | [parties.md](./parties.md) (customer/supplier) · [product.md](./product.md) (variants) · [locations.md](./locations.md) · [inventory.md](./inventory.md) (return movements) · DATABASE §10 |
| **Owner** | Backend Lead / Principal Architect |

> Goods that flow back. A **customer** return brings stock back in (**complete posts `return_in`**); a
> **supplier** return sends stock back out (**complete posts `return_out`**, negative-guarded). One
> `kind`-discriminated module. Decisions: **Decision → Why → Rejected**.

---

## 1. Scope & boundary
**Owns:** `returns` (header + embedded lines). **References:** Parties (customer or supplier by `kind`),
Catalog (variants), Locations (where stock moves). Does **not** write the ledger itself.

---

## 2. Entity
`ReturnEntity`: `returnNumber` (per-tenant `RET-0001` sequence), `kind` (`customer` | `supplier`), `partyId` +
`partyName` snapshot, `locationId`, `status`, `reason?`, `note?`, embedded `lines`, audit. **Line:**
`{ variantId, skuSnapshot, nameSnapshot, quantity }`.

> **Decision** — **one module discriminated by `kind`**, not two near-identical modules. **Why** — the flows
> differ only in party type + movement direction; DRY. **Rejected** — separate CustomerReturns/SupplierReturns
> modules.

---

## 3. DTOs
Zod in `packages/types` (`returns.ts`), `.strict()`. `CreateReturnRequest` ({ kind, partyId, locationId,
reason?, note?, lines[{variantId, quantity}] }); `Update…` (draft only; kind + party fixed); complete/cancel
are bodyless actions; `ReturnResponse` (detail w/ lines), `ReturnSummary` (list, `lineCount`).

---

## 4. Lifecycle & rules
`draft → completed`; `cancel` from **draft only**.
- Party live **for its kind** — customer for `customer`, supplier for `supplier` (422); location live (422);
  each line variant live (422).
- **complete** — from draft; posts one return movement **per line, atomically** — `return_in` (customer,
  inbound) or `return_out` (supplier, outbound, **negative-guarded** → 409 on insufficient stock) — into the
  return's location, then locks the document. Idempotent on `opKey = return:{id}:{lineId}`.

> **Decision** — **atomic completion** (no partial) and **no order linkage / quantity-against-original** check
> this wave. **Why** — keeps it lean and shippable; the ledger + negative guard keep stock correct. **Rejected**
> — half-building RMA validation. **Follow-up** — link to the originating SO/PO and cap returned qty by
> shipped/received; value customer returns at original cost.

---

## 5. API
Base `/api/v1`. `GET /returns` · `POST /returns` (201) · `GET|PATCH /returns/:id` ·
`POST /returns/:id/{complete,cancel}` (200). Permissions: `return.{view,manage}`. Errors: `VALIDATION_ERROR`
400/422 · `CONFLICT` 409 (state / insufficient stock on supplier return) · 404 (incl. cross-tenant).
`requestId` on every response.

---

## 6. Architecture
Ports-and-adapters; `ReturnsService` depends on `CatalogRef`/`PartyRef`/`LocationRef`/`ReturnPoster` ports,
bound to `CatalogQuery`/`PartyQuery`/`LocationQuery`/`InventoryService` (one-way; no cycles). `PartyQuery`
already exposes supplier+customer exists/name, so it satisfies `PartyRef` directly. Frontend: list (kind +
status) + create (kind picks the party list; `LocationPicker` + dynamic line editor) + detail with complete
(confirm) and cancel; reuses the shared `OrderStatusBadge`.

---

## 7. Testing notes
Service (fakes + in-memory repo): create with snapshots/party-name/sequence; party validated against kind;
invalid location/variant; complete posts `return_in` (customer) / `return_out` (supplier) with deterministic
opKeys; complete/edit only from draft; cancel; tenant isolation. Contracts: strict fields, kind discriminator,
≥1 line, positive quantities.

---

## 8. Status
🟢 **Implemented** (Wave 6). Sync `return.{view,manage}` into AUTHENTICATION §10. Follow-ups: link to
originating SO/PO + cap returned qty; partial completion; restocking fees / disposition (restock vs scrap);
Mongoose adapters + `counters` sequence.
