# Pagination

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [standards](./standards.md) · [frontend/tables](../frontend/tables.md)

## Purpose
Bounded, efficient list responses — never return unbounded data.

## Strategy
- **Default: cursor-based** pagination for large/hot collections (stable under inserts, scalable).
- **Offset (`page`/`limit`)** allowed for small/bounded admin lists where page jumps matter.
- Always enforce a **max `limit`** (e.g., 100) and a sane default (e.g., 20).

## Request
```
GET /products?limit=20&cursor=<opaque>        # cursor
GET /members?page=1&limit=20                   # offset
```

## Response meta
```
{ "data": [...],
  "meta": { "page": { "limit": 20, "nextCursor": "<opaque>", "hasMore": true } } }
// offset variant
{ "meta": { "page": { "page": 1, "limit": 20, "total": 240, "totalPages": 12 } } }
```

## Rules
- Cursors are opaque, signed, and encode sort+position; never expose raw internal ids as cursors.
- Pagination must use an index that matches the sort. See [database/indexes](../database/indexes.md).
- `total` is optional for cursor lists (counting can be expensive) — provide only when cheap.
- Combine cleanly with filtering and sorting.
