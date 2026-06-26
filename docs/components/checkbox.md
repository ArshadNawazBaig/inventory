# Checkbox — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Checkbox` (`@stockflow/ui` → `primitives/checkbox`) |
| **Status** | ✅ Implemented — control + 9 tests + stories in `packages/ui` (`CheckboxGroup` composite ships with `Field`) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-26 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) · [input.md](./input.md) (Field contract) · **Radix Checkbox** |

> **Architecture decision:** built on **`@radix-ui/react-checkbox`** for correct `role`, keyboard, and the
> **indeterminate** ("mixed") state that a styled native checkbox can't do reliably. Unlike Input/Textarea,
> the label sits **inline** beside the control (control + clickable label), so Field uses its **inline
> layout** (§8) rather than a top label.

---

## 1. Overview

A binary (or tri-state) selection control: "is this on?". Use for opt-ins, row selection, multi-pick
filter lists, and boolean product attributes (e.g. *Track inventory*, *Taxable*). For a single setting
that takes effect immediately, prefer **[Switch](./switch.md)**; for one-of-many, use **[Radio](./radio.md)**.

**Decision rule — Checkbox vs Switch:** Checkbox = a *value to be submitted* in a form / an item selected
from a set. Switch = a *state toggled now* (instant effect, often no Save).

---

## 2. Anatomy

```
 ┌─┐  Label text                  ← control + clickable label (inline)
 │✓│  Optional helper / description
 └─┘
 ⚠ Error                          ← Field (role=alert), for required groups

 States of the box:  ☐ unchecked   ☑ checked   ▣ indeterminate (mixed)
```

A **`CheckboxGroup`** (sibling, same spec family) renders a labelled fieldset of related checkboxes with
an optional "select all" that uses the **indeterminate** state.

---

## 3. Props (design contract)

```ts
type CheckboxSize = 'sm' | 'md';

interface CheckboxProps {
  checked?: boolean | 'indeterminate';   // controlled
  defaultChecked?: boolean;              // uncontrolled
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  size?: CheckboxSize;                   // default 'md'
  invalid?: boolean;                     // error border + aria-invalid
  disabled?: boolean;
  required?: boolean;
  name?: string;                         // for native form submission
  value?: string;                        // value when checked (groups)
  id?: string;                           // Field wires this
  // ref forwards to the control button (Radix root).
}
```

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `checked` | `boolean \| 'indeterminate'` | — | Controlled; `'indeterminate'` = mixed |
| `size` | `'sm' \| 'md'` | `md` | 16px / 20px box (§5) |
| `invalid` | `boolean` | `false` | Error styling; sets `aria-invalid` |
| `disabled` / `required` | `boolean` | `false` | Native semantics |
| `value` | `string` | — | Submitted value within a `CheckboxGroup` |

**Rules:** no `any`; `indeterminate` is a *visual/aria* state only — it is **never** a submitted value
(resolve to true/false before submit). The whole label is a click target (label `htmlFor` ↔ id).

---

## 4. Visual / variants

Single visual treatment (no color variants — semantics come from checked state):
- **Unchecked:** `border border-input bg-background`, hover `border-ring/40`.
- **Checked / indeterminate:** `bg-primary border-primary` with `primary-foreground` check / dash icon.
- **Invalid:** `border-destructive`. **Disabled:** `opacity-50`, `cursor-not-allowed`.
- Radius `rounded-[4px]` (sm) / `rounded-sm` (md); check icon from `@stockflow/icons`, `aria-hidden`.
- Optional **card style** (selectable card wrapping the checkbox) is a documented composition, not a prop.

---

## 5. Sizes

| Size | Box | Label font | Use |
|------|-----|-----------|-----|
| `sm` | 16px | `body-sm` | dense tables, filter lists, row select |
| `md` (default) | 20px | `body-sm`/`body` | forms, settings |

Hit target ≥ 24px (sm) via padding even when the box is 16px, to meet touch guidance.

---

## 6. States

unchecked / checked / **indeterminate** / hover / **focus-visible** (ring) / invalid / disabled. Checked
and indeterminate are visually distinct (check vs dash) and **announced differently** (`aria-checked`
`true` vs `mixed`).

---

## 7. Behavior

- **Controlled & uncontrolled** (`checked` vs `defaultChecked`). Toggle on `Space` and on click anywhere
  in the control or its label.
- **Indeterminate** is set by the parent (e.g. "select all" when some-but-not-all children are checked);
  clicking a mixed box resolves to checked (then unchecked), per platform convention.
- **Groups:** `CheckboxGroup` owns the array value; the header "select all" derives checked/indeterminate
  from children; each child contributes its `value`.
- **Forms:** bind via RHF **`Controller`** (boolean) or, for groups, a controlled array.

---

## 8. `Field` (inline layout) & grouping

```tsx
// Single boolean
<Field layout="inline" label="Track inventory" description="Decrement stock on each sale"
       error={errors.trackInventory?.message}>
  <Checkbox invalid={!!errors.trackInventory} {...} />
</Field>

// Group with legend + select-all
<CheckboxGroup label="Notify me about" value={value} onChange={setValue}>
  <Checkbox value="low_stock">Low stock</Checkbox>
  <Checkbox value="reorder">Reorder approved</Checkbox>
</CheckboxGroup>
```
For inline layout Field renders the label **after** the control, associates `htmlFor`/`id`, links
description + error via `aria-describedby`, sets `aria-invalid`, and shows the required `*`.

---

## 9. Accessibility (acceptance criteria)

- Radix gives `role="checkbox"`, `aria-checked` `true|false|mixed`, `Space` toggle, focus management —
  keep them.
- **Always labeled** (visible label preferred; icon-only checkboxes — e.g. a table header select — need an
  `aria-label`). Clicking the label toggles the box.
- `required`/`invalid` reflected via `aria-required`/`aria-invalid`; group errors announced (`role=alert`).
- Selection is **never** conveyed by color alone (check/dash glyph + aria). Focus-visible ring; AA contrast
  for border, fill, glyph, and label in both themes.

---

## 10. Validation & forms integration

A boolean Zod field (`z.boolean()` or `z.literal(true)` for "must accept terms"); arrays for groups
(`z.array(z.string()).min(1)`). Same schema drives RHF resolver and API DTO.

---

## 11. Testing (plan)

- **Render:** size/invalid classes; label click toggles; ref forwards.
- **State:** controlled + uncontrolled toggle; `indeterminate` renders dash + `aria-checked="mixed"`.
- **Keyboard:** `Space` toggles; focusable; disabled not focusable/togglable.
- **Group:** select-all drives indeterminate/checked; child values collected.
- **A11y:** role + aria-checked states; labeled (or aria-label); `axe` passes.

---

## 12. Documentation (deliverables)

- **Storybook:** unchecked/checked/indeterminate; sizes; invalid; disabled; with description; group +
  select-all; card style; light + dark. Autodocs.
- **MDX do/don't:** Checkbox vs Switch vs Radio guidance; never use color-only state; `indeterminate` is
  derived, not stored; always provide a label/aria-label.

---

## 13. Definition of Done

Typed (no `any`) · checked/unchecked/indeterminate · sizes · invalid + ARIA · controlled+uncontrolled +
RHF · `CheckboxGroup` with select-all · accessible (Radix role intact, axe) · Storybook stories · unit +
interaction + a11y tests · MDX docs · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
