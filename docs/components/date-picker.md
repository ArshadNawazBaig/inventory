# Date Picker — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `DatePicker` (`@stockflow/ui` → `primitives/date-picker`) |
| **Status** | ✅ Implemented — Popover + Calendar + tests + stories (Batch 6 · rich inputs) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [Calendar](./calendar.md) · [Popover](./popover.md) · [Input](./input.md) (field skin) · `date-fns` · `@stockflow/icons` |

> **Architecture decision:** Date Picker is a thin composition, not a new primitive. It wraps the
> [Calendar](./calendar.md) (drill-down and all) in a [Popover](./popover.md) behind a token **field
> trigger** that reuses the Input field skin (`inputVariants`) so it lines up pixel-for-pixel with
> `Input`/`Select` in a form. The trigger shows the formatted value (`date-fns` `format`) or a muted
> placeholder, a leading calendar glyph, and an optional clear button. Two modes — `single` (a `Date`)
> and `range` (a `DateRange`) — each fully typed via a discriminated union so `value`/`onChange` match
> the mode with no casts at the call site. Selecting in `single` mode closes the popover; `range` closes
> once both ends are chosen. Controlled or uncontrolled.

---

## 1. Overview

A compact, accessible date field: a button styled like an input that opens the Calendar in a popover.
Use it anywhere a form needs one date (received-on, expiry) or a period (report range, transfer window)
without surrendering the full width of an inline calendar. Themed entirely with design tokens.

---

## 2. API

```ts
// Discriminated union on `mode` — value/onChange follow the mode.
DatePicker (mode = 'single')
  value? / defaultValue?: Date
  onChange?: (date: Date | undefined) => void

DatePicker (mode = 'range')
  value? / defaultValue?: DateRange
  onChange?: (range: DateRange | undefined) => void
  numberOfMonths?: number = 2

// Shared (both modes)
  placeholder?: string                 // mode-aware default
  dateFormat?: string = 'PP'           // date-fns format pattern for the trigger
  disabled?: boolean                   // disables the whole field
  invalid?: boolean                    // error skin + aria-invalid
  variant?: 'default' | 'filled' | 'ghost'   // = Input variants
  inputSize?: 'sm' | 'md' | 'lg'
  clearable?: boolean                  // show a clear (✕) button when set
  disabledDays?: Matcher | Matcher[]   // Calendar `disabled` (past dates, weekends, …)
  startMonth? / endMonth?: Date        // bound navigation / drill-down
  align?: 'start' | 'center' | 'end' = 'start'
  id? / name?: string                  // label association + native form post (single)
  'aria-label'? / 'aria-labelledby'?: string
  className?: string                   // sizing/layout on the field wrapper

// Re-exported (from Calendar)
DateRange, Matcher
```

---

## 3. Behavior

- **Modes:** `single` → one `Date`; `range` → a `DateRange` (`{ from, to }`), two months by default.
- **Open/close:** click (or keyboard-activate) the trigger to open. `single` closes on pick; `range`
  closes once both ends are set; Escape and outside-click close (Popover). Focus returns to the trigger.
- **Display:** formatted via `date-fns` `format(value, dateFormat)`; empty shows the muted placeholder.
  Range shows `from – to` (en-dash), or just `from` while picking.
- **Clear:** when `clearable` and a value is set, a ✕ button (separate, not nested in the trigger button)
  resets the value without opening the popover.
- **Constraints:** `disabledDays` matchers block days in the grid; `startMonth`/`endMonth` bound the
  drill-down. Prefer these over post-validation.
- **Forms:** `single` mode renders a hidden `<input name>` carrying `yyyy-MM-dd` for native posts; with
  React Hook Form, drive `value`/`onChange` via a `Controller`.

---

## 4. Accessibility (acceptance criteria)

- Trigger is a real `<button>` with `aria-haspopup="dialog"`, `aria-expanded`, and `aria-invalid` when
  invalid; label it via `id`+`<label htmlFor>`, `aria-label`, or `aria-labelledby`.
- The popover and inner Calendar keep react-day-picker's grid semantics, `aria-selected`, labelled day
  buttons, and full keyboard navigation; Escape closes and focus returns to the trigger.
- Clear is a separately focusable button with an accessible name; the calendar glyph is decorative
  (`aria-hidden`). Value is conveyed as text, never colour alone. AA contrast in both themes.

---

## 5. Testing (plan)

- **Trigger:** renders the placeholder when empty; opens the calendar on click (`aria-expanded`).
- **Single select:** clicking a day calls `onChange` with the `Date`, updates the trigger label, and
  closes the popover.
- **Clear:** the clear button resets the value and calls `onChange(undefined)`.
- **Controlled:** a passed `value` is reflected in the trigger label.
- **Range:** picking two days yields a `from`/`to` range; the label shows both.
- **Disabled field:** the trigger is disabled and does not open.
- **A11y:** `axe` passes (closed and open).

---

## 6. Documentation (deliverables)

- **Storybook:** single · single with clear · range · disabled days · sizes/variants; light + dark.
- **MDX do/don't:** keep it controlled in forms (Controller); pick mode by need; constrain with
  `disabledDays` not post-validation; for an always-open picker use the Calendar directly.

---

## 7. Definition of Done

Typed (no `any`, discriminated union per mode) · composes Calendar + Popover (no new portal logic) ·
field skin matches Input (`inputVariants`) · single + range · formatted value via `date-fns` · clearable ·
disabled-days + bounded nav · accessible (button semantics, dialog popup, keyboard, axe) · Storybook ·
unit + a11y tests · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
