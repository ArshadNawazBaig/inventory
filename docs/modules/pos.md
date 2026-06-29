# Point of Sale — retail selling at stores

> **Status:** 🟢 Backend + frontend implemented. **Related:** [stores (locations)](./locations.md) ·
> [inventory](./inventory.md) · [auth/RBAC](./auth.md) · [PERSISTENCE](../PERSISTENCE.md) · ADR-032

POS is how a **store** sells products to customers at the counter. It's the retail complement to the order-based
**Sales** module: instead of a draft → fulfil → ship lifecycle, a sale is rung up and paid in one step.

## Stores
A "store" is a stockable **site** — the same entity as a warehouse, distinguished by `type` (`warehouse` |
`store`). Because stores reuse the site/location/inventory/transfer machinery, you get per-store stock,
warehouse→store restock via **transfers**, and per-store reporting for free. Create one under
**Warehouses & Stores** (or the API: `POST /v1/warehouses { type: "store" }`).

## A sale
1. Pick a **store** and a **location** within it to sell from.
2. Add items (product → variant); price defaults from the variant, the cashier can override.
3. Take **payment** (cash / card / other) and an amount tendered; change is computed.
4. **Complete** → the sale is recorded with a receipt number (`RC-NNNN`) and stock is decremented.

Stock leaves through **Inventory** — the single ledger writer — as one negative-guarded `shipment` movement per
line (reason `pos_sale`, idempotency-keyed `pos:<saleId>:<line>`). On Mongo this is the same
`session.withTransaction` ledger write the rest of the system uses. **Retail never oversells**: the basket is
pre-validated against available stock at the location before any movement is posted; underpayment is rejected.

## Endpoints
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| POST | `/v1/pos/sales` | `pos.sell` | Ring up a sale (payment + stock decrement + receipt) |
| GET | `/v1/pos/sales` | `pos.view` | Receipt history (filter by location) |
| GET | `/v1/pos/sales/:id` | `pos.view` | A single receipt |

## RBAC
`pos.sell` + `pos.view` are in the shared permission catalog. Owner/Admin and the **Sales/Fulfillment** and
**Warehouse Staff** roles can sell; **Viewer/Auditor** can read the history (`pos.view`) but not sell. Enforced
server-side by the `PermissionGuard`; the cashier is the session actor (`soldByUserId`).

## Persistence
Runs on the `PERSISTENCE_DRIVER` switch (in-memory default · Mongoose `mongo`, collection `pos_sales` with
embedded lines). Receipt numbers come from the shared atomic `counters` collection (per tenant). Money is
integer minor units + currency throughout.

## Follow-ups
Tax / discounts (today `total = subtotal`); refunds / voids; a true multi-line sale transaction (lines post
sequentially after a pre-check today); barcode scanning; cash-drawer / receipt printing; multi-currency POS;
optional customer loyalty. Stores also benefit from the pending **Locations → Mongo** migration so they persist
under the `mongo` driver alongside the already-migrated sale + ledger collections.
