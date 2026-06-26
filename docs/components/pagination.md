# Pagination — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Pagination` + building blocks (`@stockflow/ui` → `primitives/pagination`) |
| **Status** | ✅ Implemented — smart component + hook + parts + tests + stories (Batch 4 · navigation) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [button.md](./button.md) · `@stockflow/icons` (chevrons, ellipsis) |

> **Architecture decision:** a **controlled** page navigator. The smart `Pagination` derives the visible
> page range (with ellipses) from `page`/`pageCount` via a pure algorithm, so consumers never hand-roll
> the windowing. The same algorithm is exported (`usePaginationRange` / `getPaginationRange`) alongside
> low-level `PaginationButton` / `PaginationEllipsis` for bespoke layouts — DRY default, full
> composability. The current page fills with the **primary** colour (consistent with Sidebar/Navbar
> active state). No Radix; tokens only.

---

## 1. Overview

Navigation across pages of server- or client-paginated data (tables, lists, search results). Renders a
`<nav>` landmark of numbered cells plus optional previous/next arrows; long ranges collapse to ellipses
around the current page and the boundaries.

---

## 2. API

```ts
// Smart component (the default)
Pagination
  page: number                       // 1-based, controlled
  pageCount: number                  // renders nothing when <= 0
  onPageChange: (page) => void       // fires with the clamped next page
  siblingCount?: number = 1          // pages either side of current
  boundaryCount?: number = 1         // pages pinned at start/end
  showPrevNext?: boolean = true
  size?: 'sm' | 'md' | 'lg' = 'md'
  label?: string = 'Pagination'      // nav landmark name

// Building blocks (custom layouts)
PaginationButton   // variant: 'page' | 'nav'; size; isActive?; asChild?
PaginationEllipsis // decorative gap marker (aria-hidden)

// Range algorithm
usePaginationRange({ page, pageCount, siblingCount?, boundaryCount? })  // memoized
getPaginationRange(...)  // pure → (number | 'start-ellipsis' | 'end-ellipsis')[]
```

---

## 3. Behavior

- **Controlled.** `page` is owned by the consumer; clicks call `onPageChange` with the next page,
  **clamped** to `1..pageCount` and only when it actually changes.
- **Windowing.** `getPaginationRange` keeps `boundaryCount` pages at each end and `siblingCount` on each
  side of the current page; gaps of **more than one** page become an ellipsis (a single hidden page is
  rendered as its number, never "…").
- **Boundaries.** Previous disables on page 1; next disables on the last page.
- **Empty.** `pageCount <= 0` renders `null`.

---

## 4. Accessibility (acceptance criteria)

- Wrapper is a `<nav>` with an `aria-label` (default `"Pagination"`) → navigation landmark.
- Each page button has a discrete name (`"Go to page N"`); the current one carries
  `aria-current="page"` (not colour alone).
- Arrows have names (`"Go to previous/next page"`) and use the native `disabled` state at boundaries.
- Ellipses are `aria-hidden` (decorative). Focus-visible rings; AA contrast in both themes.

---

## 5. Testing (plan)

- **Algorithm:** ellipses on both sides mid-range; no leading ellipsis near the start; all pages when
  they fit; empty range for 0 pages.
- **Component:** labelled nav; `aria-current` on the current page; prev disabled on first / next on last;
  `onPageChange` fires with the clicked page and with `page+1` via next; renders nothing for 0 pages.
- **A11y:** `axe` passes for a long, ellipsed range.

---

## 6. Documentation (deliverables)

- **Storybook:** default · many pages (ellipses) · sizes · wide window (`siblingCount=2`) · numbers-only.
- **MDX do/don't:** keep it controlled; pair with a "X–Y of N" summary + page-size selector; tune
  density via sibling/boundary counts; don't fake "…" for a single hidden page.

---

## 7. Definition of Done

Typed (no `any`) · smart component + exported hook/algorithm + building blocks · controlled · ellipsis
windowing · primary active · accessible (nav landmark, names, `aria-current`, axe) · Storybook · unit +
a11y tests · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
