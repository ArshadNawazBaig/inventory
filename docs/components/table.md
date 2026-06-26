# Table — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Table` + parts (`@stockflow/ui` → `primitives/table`) |
| **Status** | ✅ Implemented — presentational primitives + tests + stories (Batch 5 · data) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [badge.md](./badge.md) · [checkbox.md](./checkbox.md) |

> **Architecture decision:** Table is the **presentational layer** only — semantic, token-skinned
> `<table>` primitives with **no logic and no TanStack dependency** (server-renderable, reusable). The
> smart, TanStack-powered component (sorting, selection, pagination) is **DataGrid**, which composes
> these primitives. This split keeps the styling reusable and the logic isolated. Tokens only.

---

## 1. Overview

The building blocks for any tabular data: a horizontally-scrollable, accessible `<table>` with header,
body, footer, rows, header/data cells, and a caption. Numeric columns right-align with tabular figures;
rows support a selected state and hover.

---

## 2. Parts

```ts
Table        // <div overflow-x-auto> > <table>; wrapperClassName? for the scroll container
TableHeader  // <thead>
TableBody    // <tbody>
TableFooter  // <tfoot> — styled for totals/summaries
TableRow     // <tr>; data-state="selected" highlights it
TableHead    // <th> (scope="col" by default; override to "row")
TableCell    // <td> (add `text-right tabular-nums` for numbers)
TableCaption // <caption> — names the table
```

Composition: `Table > (TableCaption · TableHeader · TableBody · TableFooter) > TableRow > (TableHead | TableCell)`.

---

## 3. Behavior

- **Overflow:** the `<table>` is wrapped in a horizontal-scroll container so wide tables never break the
  layout; pass `wrapperClassName` (e.g. `max-h-*`) to enable a **sticky header** (compose
  `[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:bg-background`).
- **Rows:** hover highlight; `data-state="selected"` applies the accent background.
- **Numbers:** right-align numeric cells and add `tabular-nums` so digits align.
- No sorting/selection/pagination logic — that's DataGrid's job.

---

## 4. Accessibility (acceptance criteria)

- Real `<table>` semantics (`table`/`rowgroup`/`row`/`columnheader`/`cell`). Header cells default to
  `scope="col"`; use `scope="row"` for row headers.
- Every table has a name — a `TableCaption` (use `sr-only` when a visible heading already names it).
- Selection checkboxes carry an `aria-label`; AA contrast for header, rows, hover, and selected in both
  themes.

---

## 5. Testing (plan)

- **Structure:** renders a `table` named by its caption; column headers expose `scope="col"`; body rows
  and cells render; row count is correct.
- **Selection:** `data-state="selected"` reflects on the row.
- **Scope:** an overridden `scope="row"` produces a `rowheader`.
- **A11y:** `axe` passes.

---

## 6. Documentation (deliverables)

- **Storybook:** default (status badges + footer total) · sticky header; light + dark.
- **MDX do/don't:** these are primitives (no logic → DataGrid); right-align + `tabular-nums` for numbers;
  always caption; label selection checkboxes.

---

## 7. Definition of Done

Typed (no `any`) · presentational parts (no TanStack dep) · scroll wrapper + sticky-header pattern ·
selected/hover states · accessible (table semantics, scope, caption, axe) · Storybook · unit + a11y
tests · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
