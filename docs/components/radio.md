# Radio — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `RadioGroup` + `RadioGroupItem` (`@stockflow/ui` → `primitives/radio`) |
| **Status** | ✅ Implemented — `RadioGroup`+`RadioGroupItem` + 7 tests + stories in `packages/ui` |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-26 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) · [checkbox.md](./checkbox.md) (sibling) · **Radix RadioGroup** |

> **Architecture decision:** built on **`@radix-ui/react-radio-group`**. A radio is meaningless alone —
> the unit is the **group**, so the public API is **`RadioGroup` (owns the value) + `RadioGroupItem`**.
> Radix gives roving-tabindex arrow-key navigation and correct `radiogroup`/`radio` roles. The group is
> labelled by a **legend** via `Field` (fieldset semantics).

---

## 1. Overview & when to use

Pick **exactly one** option from a small, mutually-exclusive set that is **all visible at once** (2–6
options): order status, costing method (FIFO/LIFO/Average), default location. For more options or a
search use **[Select](./select.md)**; for multi-pick use **[Checkbox](./checkbox.md)** groups; for on/off
use **[Switch](./switch.md)**.

---

## 2. Anatomy

```
 Group label (legend) *               ← Field wraps the group as a fieldset/legend
   ◉  Option A      desc              ← RadioGroupItem (selected = filled dot)
   ○  Option B      desc
   ○  Option C (disabled)
 Helper / ⚠ Error                     ← Field (role=alert)
```
Two presentations: **standard** (dot + label rows) and **card** (selectable cards with a border/ring on
the selected one) — same semantics, chosen via item `appearance`.

---

## 3. API (group + item)

```ts
type RadioSize = 'sm' | 'md';
type RadioAppearance = 'standard' | 'card';
type RadioOrientation = 'vertical' | 'horizontal';

interface RadioGroupProps {
  value?: string;                 // controlled
  defaultValue?: string;          // uncontrolled
  onValueChange?: (value: string) => void;
  name?: string;                  // native form name
  disabled?: boolean;             // disables all items
  required?: boolean;
  invalid?: boolean;              // group-level error styling
  orientation?: RadioOrientation; // default 'vertical'
  size?: RadioSize;               // default 'md'
}
interface RadioGroupItemProps {
  value: string;                  // required, unique in group
  disabled?: boolean;
  appearance?: RadioAppearance;   // default 'standard'
  id?: string;                    // Field/label wiring
  // children = the visible label (+ optional description)
}
```

**Rules:** no `any`; exactly one item selected at a time (enforced by Radix); each item `value` unique;
`disabled` on the group cascades to items.

---

## 4. Visual

- **Item dot:** unchecked `border border-input bg-background`; checked `border-primary` with a `bg-primary`
  inner dot. Hover raises border emphasis.
- **Card appearance:** the whole card is the target; selected card gets `border-primary ring-1 ring-ring`
  + subtle `accent` bg; supports a title + description + optional icon.
- **Invalid:** group items show `border-destructive`. **Disabled:** `opacity-50`, `cursor-not-allowed`.
- Focus-visible ring on the focused item; dot/check icon `aria-hidden`.

---

## 5. Sizes

| Size | Dot | Label | Use |
|------|-----|-------|-----|
| `sm` | 16px | `body-sm` | dense forms, inline option rows |
| `md` (default) | 20px | `body-sm`/`body` | standard forms, card options |

---

## 6. States

unchecked / checked / hover / **focus-visible** / invalid (group) / disabled (group or item). Selection is
shown by the **filled dot / card ring** plus `aria-checked`, never color alone.

---

## 7. Behavior

- **Controlled & uncontrolled** (`value` vs `defaultValue` + `onValueChange`).
- **Keyboard:** `Tab` moves into the group to the selected (or first) item; **Arrow keys** move *and*
  select among items (roving tabindex, Radix); selection wraps per orientation.
- **Card appearance** keeps identical keyboard/selection behavior — it's purely visual.
- **Forms:** bind via RHF **`Controller`** (single string value).
- **i18n/RTL:** horizontal orientation and arrow direction respect `dir`.

---

## 8. `Field` composition

```tsx
<Controller name="costingMethod" control={control}
  render={({ field, fieldState }) => (
    <Field as="fieldset" label="Costing method" required error={fieldState.error?.message}>
      <RadioGroup value={field.value} onValueChange={field.onChange} invalid={!!fieldState.error}>
        <RadioGroupItem value="fifo">FIFO</RadioGroupItem>
        <RadioGroupItem value="lifo">LIFO</RadioGroupItem>
        <RadioGroupItem value="average">Weighted average</RadioGroupItem>
      </RadioGroup>
    </Field>
  )}
/>
```
For radio groups Field renders as a **`<fieldset>`** with the label as **`<legend>`**, links description +
error via `aria-describedby` on the group, sets `aria-invalid`/`aria-required`, and shows the required `*`.

---

## 9. Accessibility (acceptance criteria)

- Radix provides `role="radiogroup"` + `role="radio"` items with `aria-checked`, roving tabindex, and
  arrow-key selection — keep them.
- The **group is labelled** by the legend (`aria-labelledby`); each item has its own visible label tied to
  its control.
- `required`/`invalid` reflected on the group; error announced (`role=alert`).
- Selection conveyed by dot/ring + `aria-checked`, never color alone. Focus-visible ring; AA contrast for
  dot, ring, label, and card border in both themes.

---

## 10. Validation & forms integration

A Zod **enum** (`z.enum([...])`) validates the single value client + server (DTO shares the enum). Field
maps the error to the group's visible/announced message.

---

## 11. Testing (plan)

- **Render:** group + items; sizes; standard vs card appearance; ref forwards on items.
- **Selection:** controlled + uncontrolled; choosing an item updates value; only one checked.
- **Keyboard:** arrow keys move + select; disabled item skipped; group disabled blocks all.
- **A11y:** radiogroup/radio roles + `aria-checked`; group labelled by legend; `axe` passes.

---

## 12. Documentation (deliverables)

- **Storybook:** vertical/horizontal; sizes; standard + card; with descriptions/icons; invalid; disabled
  (group + item); inside `Field` (fieldset/legend); light + dark. Autodocs.
- **MDX do/don't:** Radio vs Select vs Checkbox guidance; 2–6 visible options; card style for richer
  choices; always provide a group label (legend); never color-only selection.

---

## 13. Definition of Done

Typed (no `any`) · `RadioGroup`+`RadioGroupItem` · standard + card appearance · sizes · orientation ·
invalid + ARIA (fieldset/legend) · controlled+uncontrolled + RHF Controller · keyboard (roving tabindex) ·
accessible (Radix roles intact, axe) · Storybook stories · unit + interaction + a11y tests · MDX docs ·
token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
