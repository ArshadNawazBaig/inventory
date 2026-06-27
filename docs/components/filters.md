# Filters — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Filters` + `FilterChip` (`@stockflow/ui` → `primitives/filters`) |
| **Status** | ✅ Implemented — filter bar + chips + editors + tests + stories (Batch 8 · search & command) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [Popover](./popover.md) · [Button](./button.md) · [Checkbox](./checkbox.md) · [Input](./input.md) · `@stockflow/icons` |

> **Architecture decision:** Filters is the **table toolbar** for multi-criteria filtering — the bar of
> active-filter chips above a DataGrid. It's **data-driven**: you pass filter definitions
> (`select` / `multiselect` / `text`) and a controlled `value` record keyed by filter id; it renders a
> removable **chip per active filter** (click to edit in a Popover, ✕ to remove), an **"Add filter"** menu
> of inactive filters, and **"Clear all"**. It composes existing primitives — [Popover](./popover.md)
> (editors + add menu), [Checkbox](./checkbox.md) (multiselect), [Input](./input.md) (text), and
> [Button](./button.md) — rather than inventing controls, and the chip styling is shared with the standalone
> **`FilterChip`** for bespoke bars. Newly-added filters appear as a chip with their editor already open;
> emptying a filter removes its chip. State is controlled or uncontrolled. Date-range filters (via
> DatePicker) are a future addition.

---

## 1. Overview

A compact filter bar for tables and lists: active criteria as editable, removable chips plus an add menu.
Pairs with DataGrid — wire `value` to your query/column filters.

---

## 2. API

```ts
Filters
  filters: FilterDef[]                 // the available filters
  value? / defaultValue?: FilterValues // controlled / uncontrolled { [id]: string | string[] }
  onChange?: (value: FilterValues) => void
  addLabel?: string = 'Add filter'
  clearLabel?: string = 'Clear all'

type FilterDef =
  | { id: string; label: string; type: 'select';      options: FilterOption[] }
  | { id: string; label: string; type: 'multiselect'; options: FilterOption[] }
  | { id: string; label: string; type: 'text';        placeholder?: string }
type FilterOption = { value: string; label: string }
type FilterValue  = string | string[]
type FilterValues = Record<string, FilterValue | undefined>

FilterChip                            // standalone removable pill
  label: ReactNode; value?: ReactNode; onClick?: () => void; onRemove?: () => void; removeLabel?: string
```

---

## 3. Behavior

- **Chips:** one per *active* filter (a value that isn't empty). The body opens the editor Popover; the ✕
  removes the filter (deletes its key). Display: `select` → option label; `multiselect` → the single label
  or "N selected"; `text` → the text.
- **Editors:** `select` is a single-choice list (closes on pick); `multiselect` is live checkboxes; `text`
  is an Input (Enter closes).
- **Add:** the "Add filter" menu lists filters with no value; choosing one adds its chip with the editor
  open. Closing it empty removes the chip again.
- **Clear all:** appears when any filter is active; resets every value.

---

## 4. Accessibility (acceptance criteria)

- Each chip's edit trigger and ✕ are real buttons with accessible names ("Remove ‹label› filter"); the add
  menu and editors are Popovers (focus-managed, Escape closes); multiselect options expose checkbox roles.
- Keyboard operable end-to-end (open menu, choose, edit, remove); focus-visible rings; AA contrast both
  themes; meaning never by colour alone (label + value text).

---

## 5. Testing (plan)

- **Add (select):** add menu → choose a filter → pick an option ⇒ a chip appears and `onChange` gets the
  value.
- **Multiselect:** toggling options builds the array; chip shows "N selected".
- **Text:** typing sets the value; the chip reflects it.
- **Remove:** the ✕ deletes that key from `onChange`.
- **Clear all:** resets to `{}`.
- **FilterChip:** renders label/value; `onRemove` fires.
- **A11y:** `axe` passes.

---

## 6. Documentation (deliverables)

- **Storybook:** empty (add menu) · active chips (select/multiselect/text) · clear all · standalone
  FilterChip; light + dark.
- **MDX do/don't:** keep `value` controlled alongside table state; use `text` for contains-search of one
  field and `Search` for global search; don't overload the bar — group rarely-used filters; pair with
  DataGrid.

---

## 7. Definition of Done

Typed (no `any`, discriminated `FilterDef`) · data-driven chips + select/multiselect/text editors + add +
clear · composes Popover/Checkbox/Input/Button · shared `FilterChip` · controlled + uncontrolled · accessible
(labelled buttons, popover focus, checkbox roles, axe) · token-only · Storybook · unit + a11y tests.
(Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
