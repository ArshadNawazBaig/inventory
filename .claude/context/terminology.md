# Terminology & Naming (code-facing)

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [glossary](./glossary.md) · [database/naming](../database/naming.md) · [api/naming](../api/naming.md)

## Purpose
Consistent vocabulary in code, so the same concept has exactly one name everywhere.

## Canonical names (use these exactly)
| Concept | Code name | Avoid |
|---------|-----------|-------|
| Organization/tenant id | `organizationId` | `orgId`, `tenantId`, `companyId` |
| Product | `Product` / `productId` | `Item` |
| Variant | `Variant` / `variantId` | `Sku` (the SKU is a *field*) |
| SKU code | `sku` | `code`, `skuCode` |
| Location | `Location` / `locationId` | `Place`, `Bin` (bin is a location type) |
| Warehouse | `Warehouse` / `warehouseId` | `Depot`, `Store` |
| Stock ledger entry | `StockMovement` | `Transaction` (overloaded), `Entry` |
| On-hand projection | `StockLevel` | `Inventory` (too broad) |
| Reservation | `Reservation` | `Allocation` (use as verb only) |
| Purchase order | `PurchaseOrder` / `poId` | `Order` (ambiguous) |
| Sales order | `SalesOrder` / `soId` | `Order` (ambiguous) |

## Conventions (summary; full rules in linked files)
- **Collections:** plural, snake_case (`stock_movements`). See [database/naming](../database/naming.md).
- **API resources:** plural, kebab-case (`/purchase-orders`). See [api/naming](../api/naming.md).
- **Types/classes:** PascalCase. **Variables/functions:** camelCase. **Constants:** UPPER_SNAKE.
- **Booleans:** prefixed `is`/`has`/`can` (`isArchived`, `canApprove`).
- **Dates:** suffix `At` (`createdAt`, `receivedAt`); store UTC.
