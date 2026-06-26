# Calendar — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Calendar` (`@stockflow/ui` → `primitives/calendar`) |
| **Status** | ✅ Implemented — react-day-picker skin + tests + stories (Batch 6 · rich inputs) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · `react-day-picker` v10 · `date-fns` · `@stockflow/icons` |

> **Architecture decision:** a token skin over `react-day-picker` v10 — the de-facto headless date grid
> (keyboard nav, locales, single/multiple/range, matchers) — **plus a custom month/year drill-down** in
> place of react-day-picker's native-`<select>` dropdowns (which don't theme well). Clicking the header
> opens a **year grid → month grid → days** (managed by a small view state that drives the controlled
> `month`). We map v10 part keys to token classes (no CSS import) and swap nav glyphs via the `Chevron`
> component. Selected = **primary** fill; today = ring; range middle = accent. `DateRange`/`Matcher` are
> re-exported so apps don't import react-day-picker directly. This is the foundation the **Date Picker**
> wraps in a Popover.

---

## 1. Overview

An inline, accessible month grid for choosing a date, a set of dates, or a range. Fully keyboard
operable and localizable via react-day-picker; styled entirely with design tokens so it themes light/dark.

---

## 2. API

```ts
Calendar  // = react-day-picker <DayPicker>, token-skinned
  mode?: 'single' | 'multiple' | 'range'
  selected / onSelect            // controlled; value shape follows mode
  numberOfMonths?: number
  disabled?: Matcher | Matcher[] // e.g. { before: today }, { dayOfWeek: [0,6] }
  showOutsideDays?: boolean = true
  classNames?: Partial<ClassNames>  // override any part (token defaults)
  // …all react-day-picker props

// Re-exported types
DateRange, Matcher
```

---

## 3. Behavior

- **Modes:** `single` (a `Date`), `multiple` (`Date[]`), `range` (`DateRange`).
- **Selection styling** is keyed off react-day-picker's v10 modifier classes applied to the day **cell**;
  we reach the inner button via `[&>button]`. Selected = primary fill; today = primary ring; range
  middle = accent (forced over the selected fill); outside/disabled = muted.
- **Constraints:** use `disabled` matchers to block days up front (past dates, weekends, holidays).
- **Nav:** prev/next are token-styled icon buttons (glyphs via the `Chevron` component).
- **Drill-down:** the header label is a button — it opens a **year** grid, then a **month** grid, then
  returns to days. Year paging is 12 per page, clamped to `startMonth`/`endMonth` (default ±a wide
  window). Set `captionLayout` is not used — the drill-down replaces dropdowns.

---

## 4. Accessibility (acceptance criteria)

- react-day-picker provides `role="grid"`, gridcell semantics, `aria-selected`, labelled day buttons,
  and full keyboard navigation (arrows, Page Up/Down, Home/End).
- Selection is conveyed via `aria-selected` (+ primary fill), not colour alone; disabled days expose the
  `disabled` state; focus-visible rings on day and nav buttons; AA contrast in both themes.

---

## 5. Testing (plan)

- **Structure:** renders a month grid; shows the month label + two nav buttons.
- **Selection:** the selected day exposes `aria-selected`; clicking a day calls `onSelect` with that
  `Date`.
- **Constraints:** a disabled day is non-interactive and doesn't fire `onSelect`.
- **Drill-down:** clicking the header opens the year grid → month grid → returns to the day grid for the
  chosen month/year.
- **A11y:** `axe` passes.

---

## 6. Documentation (deliverables)

- **Storybook:** single · range (2 months) · multiple · disabled days; light + dark.
- **MDX do/don't:** keep it controlled; pick mode by need; constrain with matchers rather than
  post-validation; for a compact field, use the Date Picker (wraps this in a Popover).

---

## 7. Definition of Done

Typed (no `any`) · react-day-picker v10 skin (no CSS import) · single/multiple/range · primary selection ·
month/year drill-down · disabled matchers · accessible (grid semantics, keyboard, `aria-selected`, axe) ·
Storybook · unit + a11y tests · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
