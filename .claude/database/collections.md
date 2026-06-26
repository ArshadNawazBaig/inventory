# Collections

> **Status:** 🟡 Seed · **Owner:** Database Architect · **Related:** [DATABASE.md](../../docs/DATABASE.md) (canonical, Phase 5) · [relationships](./relationships.md) · [naming](./naming.md)

## Purpose
Working list of MongoDB collections. The authoritative schema design is
[`/docs/DATABASE.md`](../../docs/DATABASE.md) (Phase 5).

## Modeling principles
- **Normalized**, references over large embeds; avoid unbounded arrays.
- Every collection carries `organizationId`, `createdAt`, `updatedAt`, and soft-delete `deletedAt`.
- Immutable collections (ledger, audit) are append-only — no updates/deletes.

## Draft collection list
| Collection | Purpose | Notes |
|------------|---------|-------|
| `organizations` | Tenants | Root of isolation |
| `users` | Accounts | Auth via Better Auth |
| `memberships` | user↔org with role | Enables multi-org users |
| `roles` | System + custom roles | Bundle of permissions |
| `permissions` | Atomic permission catalog | Seeded constant set |
| `products` | Catalog parents | |
| `variants` | Sellable/stockable units | Holds `sku`, barcode |
| `categories`, `brands`, `units` | Catalog taxonomy | |
| `warehouses`, `locations` | Location hierarchy | Bin = location type |
| `stock_levels` | On-hand projection | (variant × location) |
| `stock_movements` | **Immutable ledger** | Source of truth |
| `reservations` | Allocated stock | Reduces ATP |
| `transfers` | Inter-location moves | Paired movements |
| `counts` | Cycle/physical counts | Produce variances |
| `suppliers` | Vendors | |
| `purchase_orders` | Inbound docs | Lifecycle states |
| `sales_orders` | Outbound docs | Lifecycle states |
| `audit_logs` | **Immutable** who/what/when | |
| `notifications` | In-app messages | |
| `subscriptions` | Stripe billing state | |
| `files` | Cloudinary asset metadata | |

> Fields, embeds vs refs, and validation are defined per collection in Phase 5.
