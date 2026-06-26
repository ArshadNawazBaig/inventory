# Input — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Input` (`@stockflow/ui` → `primitives/input`) |
| **Status** | 🟡 Awaiting approval — **design only, not implemented** |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-26 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [ICON_SYSTEM.md](../ICON_SYSTEM.md) · [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) · [button.md](./button.md) (template) |

> Follows the per-component template established by [Button](./button.md).
> **Enterprise principle:** the `Input` primitive is the **bare control only**. Labels,
> descriptions, validation messages, required markers, and ARIA wiring live in a separate **`Field`**
> composite (§12). This separation lets every control (Input, Select, Textarea, DatePicker,
> Combobox) reuse the *same* field scaffolding and validation contract — the single most important
> decision for a consistent, scalable forms system.

---

## 1. Overview

A single-line text control for forms and filters. It is intentionally "dumb": it renders a styled
field, supports adornments (icons/addons), and exposes an `invalid` state — but it does **not** own
its label or error text. Compose it inside `Field` (and React Hook Form) for full forms.

**Specialized siblings** (separate specs, built on the same base styles — listed so we don't overload
one component):
- **`Textarea`** — multi-line.
- **`NumberInput`** — quantities/prices: `inputMode="decimal"`, step, min/max, **no scroll-to-change**, right-aligned `tabular-nums`.
- **`CurrencyInput`** — money in integer minor units + currency (per our money rules).
- **`SearchInput`** — debounced, leading search icon, clearable (used in tables/command bar).
- **`PasswordInput`** — reveal toggle + correct autocomplete (may be a `type="password"` mode of Input).

---

## 2. Anatomy

```
 Label *                         ← owned by Field (not Input)
 ┌───────────────────────────────────────────────┐
 │ [lead] [prefix] …value/placeholder… [suffix] [trail/clear/reveal/spinner] │
 └───────────────────────────────────────────────┘
 Helper / description text            ← Field
 ⚠ Error message                      ← Field (role=alert)
```
Input owns the **box + adornments**. Field owns **label, description, error, required marker, ARIA**.

---

## 3. Props (design contract — not implementation)

```ts
import type { InputHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from '@stockflow/icons';

type InputVariant = 'default' | 'filled' | 'ghost';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  variant?: InputVariant;     // default 'default' (bordered)
  inputSize?: InputSize;      // default 'md' (named to avoid clashing with native `size`)
  invalid?: boolean;          // error styling; mirrors/forces aria-invalid
  leadingIcon?: LucideIcon;   // decorative icon, start
  trailingIcon?: LucideIcon;  // decorative icon, end
  prefix?: ReactNode;         // static addon at start (e.g. "$", "https://")
  suffix?: ReactNode;         // static addon at end (e.g. "kg", ".00")
  clearable?: boolean;        // show a clear (✕) button when there is a value
  loading?: boolean;          // spinner in the trailing slot (async validation)
  onClear?: () => void;
  // ...native attributes pass through: type, value/defaultValue, onChange, placeholder,
  //    disabled, readOnly, required, name, id, autoComplete, inputMode, maxLength,
  //    aria-describedby, aria-invalid. ref forwards to the <input>.
}
```

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `'default' \| 'filled' \| 'ghost'` | `default` | Visual treatment (§4) |
| `inputSize` | `'sm' \| 'md' \| 'lg'` | `md` | Height/padding/font (§5); aligns with Button |
| `invalid` | `boolean` | `false` | Error state; sets `aria-invalid` |
| `leadingIcon`/`trailingIcon` | `LucideIcon` | — | Decorative (`aria-hidden`) |
| `prefix`/`suffix` | `ReactNode` | — | Static addons (units, currency, protocol) |
| `clearable` | `boolean` | `false` | Clear button; calls `onClear` + native change |
| `loading` | `boolean` | `false` | Trailing spinner; for async checks (e.g. SKU uniqueness) |
| `disabled` / `readOnly` | `boolean` (native) | `false` | Distinct (§6) |
| `type` | native | `text` | `text/email/password/search/tel/url/number` |

**Rules:** no `any`; `size` is renamed `inputSize` (native `size` is a column count); adornment
priority in the trailing slot when multiple apply: **spinner → clear → reveal → trailingIcon/suffix**.

---

## 4. Variants

Token-mapped, theme-aware. All share focus + invalid behavior.

| Variant | Resting | Use |
|---------|---------|-----|
| `default` | `border border-input bg-background` | Standard form fields |
| `filled` | `bg-muted` + transparent/!border | Dense forms, filter bars, on busy backgrounds |
| `ghost` | no border/bg until focus | Inline edit (e.g. editable table cells) |

**Focus:** `ring-2 ring-ring ring-offset-2` (focus-visible). **Invalid:** `border-destructive` +
`focus:ring-destructive` + a trailing error icon (paired with Field's message — never color-only).

---

## 5. Sizes

Heights match Button so inputs and buttons align on a row. Radius `rounded-md`; numeric content
uses `tabular-nums`.

| Size | Height | Padding-x | Font | Icon | Use |
|------|--------|-----------|------|------|-----|
| `sm` | 32px | 12px | `body-sm` | 16px | dense tables/filters |
| `md` (default) | 40px | 12–16px | `body-sm` | 16–20px | standard forms |
| `lg` | 44px | 16px | `body` | 20px | prominent/marketing forms |

Adornments inset the text padding so content never overlaps icons/addons.

---

## 6. States

Defined for every variant × size:
- **default / hover** (subtle border emphasis), **focus-visible** (ring), **invalid** (§4),
- **disabled** — `opacity-50`, `cursor-not-allowed`, not focusable, value not submitted-editable;
- **readonly** — *normal* appearance, focusable, selectable/copyable, **not editable** (distinct
  from disabled — used to show locked/derived values like on-hand quantity);
- **loading** — trailing spinner; field stays interactive unless also disabled;
- **with value vs placeholder** — placeholder is `muted-foreground` and is **not** a label.

---

## 7. Adornments (icons, addons, clear, reveal, loading)

- **Icons** (`leadingIcon`/`trailingIcon`) from `@stockflow/icons`, sized to the input, `aria-hidden`,
  inherit `currentColor`. Decorative only.
- **Addons** (`prefix`/`suffix`) — static text/markup inside the field boundary (e.g. `$`, `kg`,
  `https://`). For multi-segment inputs (protocol selector + url) prefer a dedicated composite.
- **Clearable** — a focusable clear button (`aria-label="Clear"`) appears when there's a value;
  clears value, fires change, returns focus to the input.
- **Password reveal** — show/hide toggle with `aria-pressed` + `aria-label`; never logs the value.
- **Loading** — trailing spinner for async validation (e.g. "checking SKU…"); respects reduced motion.

---

## 8. Behavior

- **Controlled & uncontrolled** (`value` vs `defaultValue`); plays directly with React Hook Form
  `register`.
- **`type`/`inputMode`/`autoComplete`** are first-class — set `inputMode` for numeric/decimal/email,
  and proper `autoComplete` tokens (e.g. `email`, `new-password`).
- **Numbers/money:** prefer `NumberInput`/`CurrencyInput`; base Input with `type="number"` is allowed
  but discouraged for quantities/prices (locale, step, scroll issues). Numeric values right-align
  with `tabular-nums`.
- **i18n/RTL:** respects `dir`; adornment sides flip in RTL.
- **Paste/maxLength:** honor `maxLength`; optional character counter is rendered by `Field`.

---

## 9. Accessibility (acceptance criteria)

- **Always labeled** — via `Field` (`<label htmlFor>` ↔ input `id`). A placeholder is **never** a
  substitute for a label.
- `required` sets `aria-required` and a visible `*` (rendered by Field).
- `invalid` sets `aria-invalid="true"`; the error message is linked via `aria-describedby` and
  announced (`role="alert"`/`aria-live="polite"` on Field's error).
- Description/helper text is linked via `aria-describedby` too.
- Adornment buttons (clear/reveal) are keyboard-reachable with accessible names; decorative icons are `aria-hidden`.
- Focus-visible ring on the field; AA contrast for text, placeholder, border, and error in both themes.
- Disabled vs readonly semantics correct (readonly stays focusable/copyable).

---

## 10. Validation & forms integration

- Input exposes only `invalid` + native validity; **message/label/required live in `Field`**.
- **One Zod schema** (in `@stockflow/types`) drives the RHF resolver *and* the API DTO — same rules
  client + server. Field maps `errors[name]?.message` → the visible/announced error and sets
  `invalid`.
- Async/server validation (e.g. unique SKU): show `loading`, then `invalid` + message on failure;
  reconcile with server result on submit.

---

## 11. `Field` composition (sibling spec — summarized here)

```tsx
<Field label="SKU" required description="Unique per organization" error={errors.sku?.message}>
  <Input invalid={!!errors.sku} placeholder="e.g. SKU-001" {...register('sku')} />
</Field>
```
`Field` auto-generates the `id`, wires `htmlFor`, `aria-describedby` (description + error),
`aria-invalid`, the required `*`, and optional character counter — so every control is accessible by
construction. (Full `Field`/`FormField` spec authored separately.)

---

## 12. Testing (plan — to run once implemented)

- **Render:** variant/size classes; forwards ref; merges className.
- **Value:** controlled (`value`+`onChange`) and uncontrolled (`defaultValue`) both work.
- **Invalid:** `invalid` applies error styling and sets `aria-invalid="true"`.
- **Disabled vs readonly:** disabled blocks edit + focus; readonly blocks edit, allows focus/select.
- **Adornments:** leading/trailing icons render (`aria-hidden`); prefix/suffix render; clear button
  clears value + fires change + refocuses; password reveal toggles type + `aria-pressed`.
- **Loading:** trailing spinner shown; field still focusable.
- **RHF:** `register` wires value/onChange/ref; typing updates form state.
- **A11y:** within `Field`, label association + `aria-describedby` + error `role=alert`; `axe` passes;
  icon-only adornments have accessible names.

---

## 13. Documentation (deliverables with the component)

- **Storybook:** variants × sizes × states; with leading/trailing icon; prefix/suffix; clearable;
  password; loading; invalid; disabled; readonly; inside `Field` (label + description + error);
  light + dark. Autodocs props table.
- **MDX do/don't:** always pair with a label (`Field`); placeholder ≠ label; error text must be
  **actionable**; use `NumberInput`/`CurrencyInput` for numbers/money; don't disable without a reason.

---

## 14. Definition of Done
Typed (no `any`) · all variants/sizes/states · adornments (icons/addons/clear/reveal/loading) ·
`invalid` + ARIA hooks · controlled+uncontrolled + RHF · accessible (labeled via Field, axe) ·
Storybook stories · unit + interaction + a11y tests · MDX docs · token-only styling.
(Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
