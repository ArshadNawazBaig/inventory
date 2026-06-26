# Indexes

> **Status:** 🟡 Seed · **Owner:** Database Architect · **Related:** [collections](./collections.md) · [multi-tenancy](./multi-tenancy.md)

## Purpose
Every index is designed **before** implementation and **justified** by a query pattern.
No index without a documented reason; no hot query without a supporting index.

## Rules
- Lead compound indexes with `organizationId` (tenant scoping is in every query).
- Match index field order to query filter + sort order (ESR: Equality, Sort, Range).
- Enforce uniqueness within a tenant via compound unique indexes (`organizationId` + key).
- Use partial indexes to exclude soft-deleted docs where it helps.
- Review with `explain()`; target `IXSCAN`, avoid `COLLSCAN` on hot paths.

## Seed index plan (illustrative — finalized in Phase 5)
| Collection | Index | Reason |
|------------|-------|--------|
| `variants` | `{ organizationId, sku }` unique | SKU uniqueness + lookup |
| `variants` | `{ organizationId, productId }` | List variants of a product |
| `stock_levels` | `{ organizationId, variantId, locationId }` unique | On-hand lookup |
| `stock_movements` | `{ organizationId, variantId, locationId, createdAt }` | Movement history / reconcile |
| `stock_movements` | `{ organizationId, createdAt }` | Tenant-wide ledger scans (reports) |
| `reservations` | `{ organizationId, variantId, locationId, status }` | ATP calculation |
| `purchase_orders` | `{ organizationId, status, expectedAt }` | PO lists/filters |
| `sales_orders` | `{ organizationId, status, createdAt }` | SO lists/filters |
| `audit_logs` | `{ organizationId, entityType, entityId, createdAt }` | Entity audit trail |
| `audit_logs` | `{ organizationId, actorId, createdAt }` | Actor audit filter |

> Each real index ships with: the query it serves, expected selectivity, and write-cost note.
