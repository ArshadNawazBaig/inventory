# Select — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Select` (`@stockflow/ui` → `primitives/select`) |
| **Status** | 🟡 Designed — awaiting approval (Batch 1 · forms) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-26 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) · [input.md](./input.md) (trigger matches Input) · **Radix Select** |

> **Architecture decision:** built on **`@radix-ui/react-select`**, not native `<select>` and not a
> hand-rolled listbox. Radix gives us correct listbox/option roles, keyboard nav, typeahead, portalled
> popover, scroll buttons, and collision-aware positioning for free; we skin it with our tokens. The
> **trigger** is styled to match [Input](./input.md) so a Select and an Input align on a row.

---

## 1. Scope — which "select" is this?

This component is the **single-select from a known, finite list**. Two sibling components (separate
specs) cover the other cases so we never overload one API:

| Need | Component | Why separate |
|------|-----------|--------------|
| Pick **one** from a known list (status, category, unit) | **`Select`** *(this spec)* | No search needed |
| Pick one from a **large/remote/searchable** list (supplier, SKU) | **`Combobox`** *(future)* | Needs filtering, async, free text |
| Pick **many** (tags, locations) | **`MultiSelect`** *(future)* | Needs chips, multi-value model |
| Trivial, native-feel, perf-critical mobile | **`NativeSelect`** *(future, thin)* | Uses OS picker |

---

## 2. Anatomy

```
 Label *                               ← Field
 ┌──────────────────────────────┐
 │ [icon] Selected value      ⌄ │      ← Trigger (styled like Input)
 └──────────────────────────────┘
   ┌────────────────────────────┐
   │ ⌃ scroll up                 │      ← Content (portalled popover)
   │ Group label                 │      ← SelectGroup + SelectLabel
   │  ✓ [icon] Option  desc      │      ← SelectItem (check on selected)
   │    [icon] Option (disabled) │
   │ ───────────                 │      ← SelectSeparator
   │ ⌄ scroll down               │
   └────────────────────────────┘
 Helper / ⚠ Error                      ← Field
```

---

## 3. API (composable, shadcn-style parts)

```ts
// Composable parts (primary API)
<Select>            // root: value/defaultValue, onValueChange, name, disabled, required
  <SelectTrigger    // variant, inputSize, invalid, placeholder, leadingIcon, id
    aria-label?  />
  <SelectContent>   // position 'popper'|'item-aligned'; portalled
    <SelectGroup>
      <SelectLabel>Group</SelectLabel>
      <SelectItem value="..." disabled? icon? description?>Label</SelectItem>
      <SelectSeparator />
    </SelectGroup>
  </SelectContent>
</Select>
```

```ts
type SelectVariant = 'default' | 'filled' | 'ghost';   // mirrors Input
type SelectSize    = 'sm' | 'md' | 'lg';               // heights match Input/Button

interface SelectTriggerProps {
  variant?: SelectVariant;     // default 'default'
  inputSize?: SelectSize;      // default 'md'
  invalid?: boolean;           // error border + aria-invalid on trigger
  placeholder?: string;        // shown (muted) when no value
  leadingIcon?: LucideIcon;    // optional decorative icon
}
interface SelectItemProps {
  value: string;               // required, unique within the Select
  disabled?: boolean;
  icon?: LucideIcon;           // decorative, start
  description?: string;        // secondary line under the label
}
```

A convenience `options={[{label,value,icon?,description?,disabled?}]}` prop MAY be offered for simple
flat lists, but the composable parts are canonical (needed for groups/separators/custom items).

---

## 4. Variants & sizes

Trigger reuses [Input](./input.md)'s `variant` (default/filled/ghost) and size tokens (`sm` 32 / `md` 40
/ `lg` 44px) so Selects line up with Inputs and Buttons. Content/items use `popover`/`accent` tokens; the
selected item shows a leading check and `accent` background; radius `rounded-md`, elevation `shadow-md`.

---

## 5. States

**Trigger:** default / hover / **focus-visible** (ring) / **open** (ring persists) / **invalid**
(`border-destructive`) / **disabled** (`opacity-50`, not focusable) / **placeholder** (`muted-foreground`).
**Item:** default / highlighted (keyboard or hover → `accent`) / selected (check) / disabled.

---

## 6. Behavior

- **Open/close** via click, `Enter`/`Space`/`Arrow`; **typeahead** jumps to matching option; `Esc` closes
  and returns focus to the trigger (Radix).
- **Controlled & uncontrolled** (`value` vs `defaultValue` + `onValueChange`).
- **Portalled** content with collision-aware positioning; `position="popper"` to match trigger width via
  `--radix-select-trigger-width`; **scroll buttons** for long lists. Long lists (100s) are fine; for
  1000s or remote data use **Combobox** (virtualized) instead.
- **Forms:** Radix renders a hidden native input for `name`/`required`, but we bind via RHF
  **`Controller`** (not `register`) since the value is not a plain DOM event. Empty-state value is `''`
  (or a sentinel) — never `undefined` in a controlled form.
- **i18n/RTL:** respects `dir`; check/scroll affordances flip.

---

## 7. Accessibility (acceptance criteria)

- Radix provides `role="combobox"` trigger ↔ `listbox` content ↔ `option` items with `aria-selected`,
  `aria-expanded`, active-descendant, and full keyboard support — **do not override these roles**.
- **Labeled** via `Field` (`htmlFor` → trigger `id`); placeholder is not a label.
- `invalid` → `aria-invalid="true"` on the trigger; error linked via `aria-describedby` + `role="alert"`.
- Decorative item/leading icons are `aria-hidden`; the **check** indicator is not the only selection cue
  (selected item also uses `accent` + is announced).
- Focus-visible ring on the trigger; AA contrast for trigger text, placeholder, items, and highlight in
  both themes; respects reduced motion on open/close.

---

## 8. Validation & forms integration

```tsx
<Controller
  name="category" control={control}
  render={({ field, fieldState }) => (
    <Field label="Category" required error={fieldState.error?.message}>
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger invalid={!!fieldState.error} placeholder="Select a category" />
        <SelectContent>{/* items */}</SelectContent>
      </Select>
    </Field>
  )}
/>
```
**One Zod enum** in `@stockflow/types` validates the value client + server (the DTO uses the same enum).

---

## 9. Testing (plan)

- **Render:** trigger variant/size/invalid classes; placeholder shows when empty.
- **Open + select:** opening lists options; choosing one updates value, closes, refocuses trigger; check
  appears on selected.
- **Keyboard:** arrow + typeahead navigation; `Esc` closes; disabled item not selectable.
- **Controlled vs uncontrolled:** both reflect/emit value via `onValueChange`.
- **RHF Controller:** value flows to form state; `invalid` sets `aria-invalid`.
- **A11y:** roles/`aria-selected`/`aria-expanded` present; within `Field` label association + error
  `role=alert`; `axe` passes (note: test the open content via portal).

---

## 10. Documentation (deliverables)

- **Storybook:** variants × sizes; with groups + separators; item icons + descriptions; long list (scroll
  buttons); invalid; disabled; controlled; inside `Field`; light + dark. Autodocs.
- **MDX do/don't:** use for short known lists; switch to **Combobox** when users would want to search;
  always provide a label; option text must be self-explanatory (no color-only meaning).

---

## 11. Definition of Done

Typed (no `any`) · composable parts (+ optional `options`) · variants/sizes match Input · invalid + ARIA ·
controlled+uncontrolled + RHF `Controller` · portalled, keyboard + typeahead, scroll buttons · accessible
(Radix roles intact, axe) · Storybook stories · unit + interaction + a11y tests · MDX docs · token-only
styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
