# Filtering

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [standards](./standards.md) · [sorting](./sorting.md) · [database/indexes](../database/indexes.md)

## Purpose
Consistent, safe, index-aware filtering on list endpoints.

## Syntax
- `filter[field]=value` for equality; documented operators where needed:
  `filter[field][gte]=`, `[lte]`, `[in]=a,b`, `[ne]`, `[exists]`.
- Free-text search via `q=` (scoped to documented searchable fields).
- Example: `GET /sales-orders?filter[status]=open&filter[createdAt][gte]=2026-01-01&q=acme`

## Rules
- **Allow-list filterable fields per endpoint** — reject unknown fields (no arbitrary query injection).
- Validate operator/value types via the query DTO (Zod). See [backend/validation](../backend/validation.md).
- Filters are **tenant-scoped** automatically; clients cannot widen scope.
- Filterable fields must be **indexed** for hot paths. See [database/indexes](../database/indexes.md).
- Faceted filters in the UI map 1:1 to these params. See [frontend/tables](../frontend/tables.md).

## Don'ts
- No raw Mongo query objects from the client.
- No filtering on un-indexed fields for large collections without a documented exception.
