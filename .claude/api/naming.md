# API Naming

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [standards](./standards.md) · [context/terminology](../context/terminology.md)

## Purpose
Consistent, guessable endpoint and parameter names.

## Resources & paths
- Plural nouns, kebab-case: `/products`, `/purchase-orders`, `/stock-movements`.
- Nesting reflects ownership, shallow (≤ 2 levels): `/products/:productId/variants`.
- Actions that aren't CRUD use a sub-resource verb via POST:
  `/purchase-orders/:id/receive`, `/sales-orders/:id/allocate`, `/stock/:id/adjust`.

## Identifiers
- Path params: `:resourceId` (e.g., `:purchaseOrderId`).
- Never accept `organizationId` as a param — it comes from auth context. See [security/tenant-isolation](../security/tenant-isolation.md).

## Query parameters
- Pagination: `page`/`limit` or `cursor`. See [pagination](./pagination.md).
- Filtering: `filter[field]=value` (or documented shorthands). See [filtering](./filtering.md).
- Sorting: `sort=field` / `sort=-field`. See [sorting](./sorting.md).
- Search: `q=`.

## Fields
- JSON bodies use `camelCase` (matches DTOs/types). Booleans `is/has/can`; dates ISO-8601 UTC.
- Enum values are lowercase strings, shared from `packages/types`.
