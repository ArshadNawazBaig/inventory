# Tables & Data Grids

> **Status:** 🟡 Seed · **Owner:** Frontend Lead · **Related:** [api/pagination](../api/pagination.md) · [api/filtering](../api/filtering.md) · [performance](./performance.md)

## Purpose
Consistent, performant tabular UIs for large datasets (100k+ rows) using TanStack Table.

## Rules
- Build on **TanStack Table** wrapped by the design-system `Table`/`DataGrid` component.
- **Server-side** pagination, sorting, and filtering for large lists — never load all rows.
- Filter/sort/page state lives in the **URL** (shareable, restorable).
- **Virtualize** rows for long lists; fixed header; column resize/visibility where useful.
- Provide loading skeletons, empty states, and error states (design-system components).
- Row actions are permission-gated (`PermissionWrapper`).

## Features to support
- Column sorting (single/multi), column visibility, density toggle.
- Faceted filters mapped to API filter params. See [api/filtering](../api/filtering.md).
- Bulk selection + bulk actions (with confirm dialogs).
- CSV/XLSX export via async job for large exports.

## Don'ts
- No client-side sort/filter over server-paginated data (it lies to the user).
- No unbounded fetches "just to count".
