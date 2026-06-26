# Database Naming

> **Status:** 🟡 Seed · **Owner:** Database Architect · **Related:** [context/terminology](../context/terminology.md)

## Purpose
Consistent, predictable names across all collections and fields.

## Collections
- Plural, `snake_case`: `products`, `stock_movements`, `purchase_orders`.

## Fields
- `camelCase`: `organizationId`, `reorderPoint`, `expectedAt`.
- IDs: `<entity>Id` referencing `<entities>._id` (e.g., `variantId` → `variants`).
- Booleans: `is`/`has`/`can` prefix (`isArchived`, `hasVariants`).
- Timestamps: `At` suffix, UTC (`createdAt`, `updatedAt`, `deletedAt`, `receivedAt`).
- Money: store as integer minor units + `currency` (e.g., `unitCostMinor`, `currency`).
- Quantities: integers where unit allows; decimals via a fixed-precision strategy otherwise.

## Standard fields on every document
`_id`, `organizationId`, `createdAt`, `updatedAt`, `deletedAt` (nullable), `createdBy`, `updatedBy`.

## Enums
- Stored as lowercase string constants (`status: "draft" | "approved" | ...`).
- Defined once in `packages/types` and reused by API + DB + UI.

## Don'ts
- No abbreviations that aren't canonical (`qty` is allowed; `wh` for warehouse is not).
- No ambiguous `order` — use `purchaseOrder` / `salesOrder`.
- No reserved-word collisions; no mixed casing within a name.
