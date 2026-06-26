# Database Design

| Field | Value |
|-------|-------|
| **Document** | Database Design (MongoDB / Mongoose) |
| **Status** | ⚪ Not started — pending Architecture approval |
| **Phase** | 5 — Database |
| **Depends on** | [ARCHITECTURE.md](./ARCHITECTURE.md), [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) |
| **Owner** | Database Architect |

> This document is reserved. It will define the data model before any schema is implemented.
> The outline below defines its scope.

## Planned contents

- Modeling principles: normalized collections, references over large embeds, transactions
- Tenancy: `organizationId` on every collection; compound-index strategy for isolation
- Collections (draft list): `organizations`, `users`, `memberships`, `roles`, `permissions`,
  `products`, `variants`, `categories`, `brands`, `units`, `warehouses`, `locations`,
  `stock_levels` (projection), `stock_ledger` (immutable), `reservations`, `transfers`,
  `counts`, `suppliers`, `purchase_orders`, `sales_orders`, `audit_logs`, `notifications`,
  `subscriptions`, `files`
- Stock ledger schema (append-only) and on-hand projection reconciliation (ref. AD-2)
- Product → Variant → Stock relationships (ref. AD-3)
- Location hierarchy: Warehouse → Zone → Bin (ref. AD-4)
- Index design with rationale for **each** index (query patterns → indexes)
- Transaction boundaries for critical stock operations
- Soft-delete & versioning conventions
- Data retention, archival, and migration strategy
