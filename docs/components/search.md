# Search — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Search` (`@stockflow/ui` → `primitives/search`) |
| **Status** | ✅ Implemented — debounced search field + tests + stories (Batch 8 · search & command) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [Input](./input.md) (field) · `@stockflow/icons` |

> **Architecture decision:** Search **composes [Input](./input.md)** rather than re-building a field — it
> reuses Input's leading icon, `clearable`, and `loading` adornments, and layers search behaviour on top:
> a built-in **debounce** (one `onSearch` for queries, plus an immediate `onValueChange` for the value),
> **Enter** to fire immediately, **Escape** to clear, and an optional single-key **shortcut** (e.g. `/`)
> that focuses the field from anywhere and shows a `kbd` hint while empty. It's controlled or uncontrolled.
> This is the inline search box (product tables, location pickers); the multi-criteria **Filters** and the
> global **Command Palette** are separate components in this batch. Tokens only; themes light/dark.

---

## 1. Overview

A search-as-you-type input: magnifier icon, debounced query callback, clear button, optional loading
spinner, and an optional keyboard shortcut to focus it. Wire `onSearch` to your query (TanStack Query, a
filter, an API call).

---

## 2. API

```ts
Search   // composes Input
  value? / defaultValue?: string         // controlled / uncontrolled
  onValueChange?: (value: string) => void // every keystroke (immediate)
  onSearch?: (value: string) => void      // debounced + on Enter / clear
  debounce?: number = 300                 // ms (0 = immediate)
  shortcut?: string                       // single key, e.g. '/', focuses the field; shows a kbd hint
  loading?: boolean                       // trailing spinner (query in flight)
  placeholder?: string = 'Search…'
  // inherits Input: variant, inputSize, invalid, disabled, aria-label (default 'Search'), …
```

---

## 3. Behavior

- **Debounce:** typing updates the value immediately (`onValueChange`) and schedules `onSearch` after
  `debounce` ms; a new keystroke resets the timer. **Enter** flushes `onSearch` now; **clear**/**Escape**
  fire `onSearch('')`.
- **Clear:** the ✕ (Input's `clearable`) appears with a value, clears it, refocuses, and fires `onSearch('')`.
- **Shortcut:** when `shortcut` is set, pressing that key outside any input/textarea focuses the field; a
  `kbd` hint shows while the field is empty and unfocused (hidden once focused, filled, or loading).
- **Loading:** pass `loading` while the query runs — Input shows a trailing spinner (and hides the clear).

---

## 4. Accessibility (acceptance criteria)

- The field has an accessible name (`aria-label` default "Search") and a decorative magnifier icon; the
  clear button is labelled; focus-visible ring via Input.
- The shortcut listener ignores keystrokes while typing in other fields; the `kbd` hint is decorative.
  AA contrast in both themes.

---

## 5. Testing (plan)

- **Value vs search:** typing fires `onValueChange` immediately but `onSearch` only after the debounce.
- **Enter:** flushes `onSearch` without waiting.
- **Clear:** the ✕ empties the field and fires `onSearch('')`.
- **Escape:** clears the field.
- **Shortcut:** pressing the key focuses the field; the hint renders while empty.
- **A11y:** `axe` passes.

---

## 6. Documentation (deliverables)

- **Storybook:** basic · with shortcut (`/`) · loading · sizes/variants · live-filtering a list; light + dark.
- **MDX do/don't:** debounce network queries (don't fire per keystroke); wire `onSearch` (not
  `onValueChange`) to the query; show `loading` during the request; for multi-field filtering use Filters,
  for global navigation use the Command Palette.

---

## 7. Definition of Done

Typed (no `any`) · composes Input (no duplicated field) · debounced `onSearch` + immediate `onValueChange` ·
Enter/Escape/clear · optional focus shortcut + kbd hint · loading · controlled + uncontrolled · accessible
(name, labelled clear, shortcut ignores typing, axe) · token-only · Storybook · unit + a11y tests.
(Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
