# Switch — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Switch` (`@stockflow/ui` → `primitives/switch`) |
| **Status** | 🟡 Designed — awaiting approval (Batch 1 · forms) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-26 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) · [checkbox.md](./checkbox.md) (sibling) · **Radix Switch** |

> **Architecture decision:** built on **`@radix-ui/react-switch`** (`role="switch"`). A Switch is **not** a
> styled checkbox: it carries the semantic of an **on/off setting that takes effect immediately**. Same
> inline `Field` layout as [Checkbox](./checkbox.md).

---

## 1. Overview & when to use

A toggle for an **on/off state**, typically a setting that applies right away (no Save button): *Enable
low-stock alerts*, *Auto-reorder*, *Maintenance mode*, *Dark theme*.

**Switch vs Checkbox (the rule):**

| Use **Switch** when… | Use **[Checkbox](./checkbox.md)** when… |
|----------------------|------------------------------|
| It's a setting/preference with **instant effect** | It's a **form value submitted on Save** |
| Two clear opposite states (on/off, enabled/disabled) | Selecting item(s) from a set / agreeing to terms |
| No "indeterminate" needed | You may need indeterminate / select-all |

If a toggle only matters after the user clicks **Save**, it's probably a Checkbox.

---

## 2. Anatomy

```
 Label text                    ◯─    (off)
 Optional description          ─●    (on → track = primary)
```
Common layouts: **label-left / switch-right** (settings rows) or **switch-left / label-right** (compact
opt-ins). Field's inline layout supports both via `reverse`.

---

## 3. Props (design contract)

```ts
type SwitchSize = 'sm' | 'md';

interface SwitchProps {
  checked?: boolean;                         // controlled
  defaultChecked?: boolean;                  // uncontrolled
  onCheckedChange?: (checked: boolean) => void;
  size?: SwitchSize;                         // default 'md'
  disabled?: boolean;
  required?: boolean;
  name?: string;                             // native form value
  value?: string;                            // value when on (default 'on')
  id?: string;                               // Field wires this
  // ref forwards to the Radix switch root (button).
}
```

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `checked` | `boolean` | — | Controlled on/off (no indeterminate) |
| `size` | `'sm' \| 'md'` | `md` | Track 32×18 / 44×24 (§5) |
| `disabled` / `required` | `boolean` | `false` | Native semantics |

**Rules:** no `any`; **no `indeterminate`** (it's binary); never use a Switch for a destructive instant
action without a confirm. Optimistic UI: reflect the new state immediately, then reconcile with the server
(roll back + toast on failure).

---

## 4. Visual

- **Off:** track `muted` / `input`, thumb `background` (light) — clear "empty" look.
- **On:** track `bg-primary`, thumb `primary-foreground`/white, thumb slides to end (animated, reduced-motion
  safe via `transitions` tokens).
- **Disabled:** `opacity-50`, `cursor-not-allowed`. **Focus-visible:** ring on the track.
- No invalid border by default (settings rarely "invalid"); `required` switches (e.g. accept terms via a
  switch — discouraged; prefer Checkbox) get an error message from Field.

---

## 5. Sizes

| Size | Track | Thumb | Label | Use |
|------|-------|-------|-------|-----|
| `sm` | 32×18px | 14px | `body-sm` | dense settings lists, table rows |
| `md` (default) | 44×24px | 20px | `body-sm`/`body` | settings pages, forms |

Hit target ≥ 24px height including padding; the label is part of the toggle target.

---

## 6. States

off / on / hover / **focus-visible** / disabled. Thumb position + track color both encode state (never
color alone — position is the redundant cue).

---

## 7. Behavior

- **Controlled & uncontrolled** (`checked` vs `defaultChecked`); toggles on click (control or label) and on
  `Space`/`Enter`.
- **Instant effect / optimistic:** the common pattern is no Save — call the mutation on change, show
  optimistic state, and on error revert + surface a toast. This pattern is documented, not enforced by the
  component.
- **Forms (rare):** when a Switch *is* a submitted boolean, bind via RHF **`Controller`**.
- **i18n/RTL:** thumb travel direction flips with `dir`.

---

## 8. Accessibility (acceptance criteria)

- Radix provides `role="switch"` + `aria-checked` `true|false` + keyboard — keep them. (Note: `switch`
  role, not `checkbox`.)
- **Always labeled** (visible label or `aria-label`); the label toggles the switch.
- State conveyed by **thumb position + color + aria-checked**, never color alone.
- Focus-visible ring; AA contrast for track (both states), thumb, and label in both themes; animation
  respects `prefers-reduced-motion`.

---

## 9. Testing (plan)

- **Render:** size classes; label click toggles; ref forwards.
- **State:** controlled + uncontrolled toggle; `onCheckedChange` fires boolean.
- **Keyboard:** `Space`/`Enter` toggles; disabled not focusable/togglable.
- **A11y:** `role="switch"` + `aria-checked`; labeled; `axe` passes.
- **Optimistic pattern (docs/example test):** revert on rejected mutation.

---

## 10. Documentation (deliverables)

- **Storybook:** off/on; sizes; disabled; label-left vs label-right; settings-row example; optimistic w/
  rollback story; light + dark. Autodocs.
- **MDX do/don't:** Switch vs Checkbox rule; instant effect → optimistic + toast; confirm destructive
  toggles; always label.

---

## 11. Definition of Done

Typed (no `any`) · on/off (no indeterminate) · sizes · disabled + focus · controlled+uncontrolled + RHF
(Controller, rare) · optimistic pattern documented · accessible (`role="switch"`, axe) · Storybook stories ·
unit + interaction + a11y tests · MDX docs · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
