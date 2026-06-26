# DataGrid — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `DataGrid` (`@stockflow/ui` → `primitives/data-grid`) |
| **Status** | ✅ Implemented — TanStack-powered smart table + tests + stories (Batch 5 · data) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [table.md](./table.md) · [pagination.md](./pagination.md) · [checkbox.md](./checkbox.md) · `@tanstack/react-table` |

> **Architecture decision:** DataGrid is the **logic layer** over the presentational [Table](./table.md)
> primitives. It uses **TanStack Table** (headless) for client-side sorting, row selection, and
> pagination, and composes our [Pagination](./pagination.md) + [Checkbox](./checkbox.md). It's a generic
> function component (`DataGrid<TData>`) — not `forwardRef` — so column/data types flow through. The
> TanStack `ColumnDef` type is re-exported so apps type columns without a direct TanStack dependency.

---

## 1. Overview

A drop-in data table: pass `columns` + `data` and get sortable headers (with `aria-sort` + chevrons), an
optional selection checkbox column, client-side pagination, and built-in loading (skeleton) and empty
states — all themed via tokens.

---

## 2. API

```ts
DataGrid<TData>
  columns: ColumnDef<TData>[]            // TanStack column defs
  data: TData[]
  caption?: string                       // accessible table name
  captionSrOnly?: boolean = false        // visually hide the caption
  enableSorting?: boolean = true         // client-side sorting
  enableRowSelection?: boolean = false   // checkbox column
  onRowSelectionChange?: (rows: TData[]) => void
  getRowId?: (row, index) => string      // stable ids (recommended when selecting)
  enablePagination?: boolean = true      // client-side pagination
  pageSize?: number = 10
  loading?: boolean = false              // skeleton rows
  loadingRowCount?: number = pageSize
  emptyState?: ReactNode = 'No results.'
```

---

## 3. Behavior

- **Sorting:** click a sortable header to cycle asc → desc → none; the active direction shows a chevron
  and sets `aria-sort` on the `<th>`.
- **Selection:** a leading checkbox column with a tri-state header (all / some → `indeterminate` / none).
  Selected rows get `data-state="selected"` and are emitted via `onRowSelectionChange`. Provide
  `getRowId` so selection survives sorting/paging.
- **Pagination:** client-side via TanStack's pagination row model, rendered with the
  [Pagination](./pagination.md) component (hidden when there's a single page).
- **States:** `loading` renders `loadingRowCount` skeleton rows; an empty dataset renders `emptyState`.
- **Manual / server-side (extension):** for 100k+ SKUs, drive `data` + page count externally and switch
  TanStack to manual sorting/pagination — the rendering contract is unchanged.

---

## 4. Accessibility (acceptance criteria)

- Real `<table>` semantics (via Table primitives); the grid is named by `caption`.
- Sortable headers are buttons; the sorted column exposes `aria-sort="ascending|descending"`.
- Selection checkboxes have names ("Select row" / "Select all rows on this page"); the selection summary
  is an `aria-live="polite"` region.
- Keyboard operable (header sort buttons, checkboxes, pagination); AA contrast in both themes.

---

## 5. Testing (plan)

- **Data:** renders rows; named by caption.
- **Sorting:** clicking a header reorders rows and sets `aria-sort`.
- **Pagination:** page 2 shows the next slice.
- **Selection:** selecting a row emits it + marks `data-state="selected"`; header checkbox selects the page.
- **States:** empty state renders; loading renders skeleton rows (no data).
- **A11y:** `axe` passes (with selection enabled).

---

## 6. Documentation (deliverables)

- **Storybook:** default · selectable · loading · empty; light + dark.
- **MDX do/don't:** memoize columns; provide `getRowId` when selecting; always caption; client-side by
  default → manual mode for very large datasets.

---

## 7. Definition of Done

Typed generic (no `any`) · TanStack sorting/selection/pagination over Table primitives · loading + empty
states · accessible (table semantics, `aria-sort`, named checkboxes, live region, axe) · Storybook ·
unit + a11y tests · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
