# Sorting

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [pagination](./pagination.md) · [filtering](./filtering.md)

## Purpose
Predictable, index-backed sorting on list endpoints.

## Syntax
- `sort=field` (ascending), `sort=-field` (descending).
- Multi-sort: comma-separated, in priority order: `sort=-createdAt,name`.

## Rules
- **Allow-list sortable fields per endpoint**; reject others.
- Sort fields must be backed by an index that matches filter+sort order (ESR). See [database/indexes](../database/indexes.md).
- Always apply a **stable tiebreaker** (e.g., `_id`) so pagination is deterministic.
- Cursor pagination encodes the sort; changing sort starts a new cursor sequence. See [pagination](./pagination.md).
- Default sort is documented per endpoint (commonly `-createdAt`).

## Don'ts
- No sorting on un-indexed fields for large collections.
- No nondeterministic ordering (always include a unique tiebreaker).
