# Textarea — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Textarea` (`@stockflow/ui` → `primitives/textarea`) |
| **Status** | ✅ Implemented — control + 11 tests + stories in `packages/ui` |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-26 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) · [input.md](./input.md) (shares base box styles + Field contract) |

> Sibling of [Input](./input.md). Reuses the **same variant/size token system and `Field` contract**:
> the `Textarea` primitive is the **bare multi-line control only** — labels, descriptions, validation
> messages, required markers, ARIA wiring, and the character counter live in **`Field`** (§11).

---

## 1. Overview

A multi-line free-text control for descriptions, notes, addresses, and audit comments. Like Input it
is intentionally "dumb": it renders a styled box and exposes an `invalid` state but does **not** own
its label or error. Adds one capability Input lacks: optional **auto-resize** so the box grows with
content between a min and max height.

**Use it for:** product/variant descriptions, supplier notes, adjustment reasons, internal comments.
**Don't use it for:** rich text (future `RichTextEditor`), single-line values (use `Input`), or code.

---

## 2. Anatomy

```
 Label *                              ← owned by Field (not Textarea)
 ┌───────────────────────────────────────────────┐
 │ …value / placeholder…                          │
 │                                                │
 │                                          ⤡ grip│ ← optional resize handle
 └───────────────────────────────────────────────┘
 Helper / description text         0 / 500         ← Field (helper + counter)
 ⚠ Error message                                   ← Field (role=alert)
```
Textarea owns the **box**. Field owns **label, description, counter, error, required marker, ARIA**.

---

## 3. Props (design contract — not implementation)

```ts
import type { TextareaHTMLAttributes } from 'react';

type TextareaVariant = 'default' | 'filled' | 'ghost';
type TextareaSize = 'sm' | 'md' | 'lg';
type TextareaResize = 'none' | 'vertical' | 'both';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  variant?: TextareaVariant;   // default 'default'
  inputSize?: TextareaSize;    // default 'md' (named like Input to stay consistent)
  invalid?: boolean;           // error styling; mirrors/forces aria-invalid
  autoResize?: boolean;        // grow with content (default false)
  minRows?: number;            // auto-resize floor (default 3)
  maxRows?: number;            // auto-resize ceiling, then scroll (default 8)
  resize?: TextareaResize;     // manual resize handle; default 'vertical', forced 'none' if autoResize
  // ...native attributes pass through: value/defaultValue, onChange, placeholder, rows, disabled,
  //    readOnly, required, name, id, maxLength, autoComplete, aria-describedby, aria-invalid.
  //    ref forwards to the <textarea>.
}
```

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `'default' \| 'filled' \| 'ghost'` | `default` | Same tokens as Input (§4) |
| `inputSize` | `'sm' \| 'md' \| 'lg'` | `md` | Font/padding/min-height (§5) |
| `invalid` | `boolean` | `false` | Error state; sets `aria-invalid` |
| `autoResize` | `boolean` | `false` | Height tracks content between `minRows`/`maxRows` |
| `minRows` / `maxRows` | `number` | `3` / `8` | Auto-resize bounds; past `maxRows` it scrolls |
| `resize` | `'none' \| 'vertical' \| 'both'` | `vertical` | Manual grip; ignored (forced `none`) when `autoResize` |
| `maxLength` | native | — | Enforced by browser; **counter rendered by Field** |

**Rules:** no `any`; `size` renamed `inputSize` for cross-control consistency; `autoResize` and a manual
`resize` handle are mutually exclusive (auto wins). No leading/trailing icon adornments (multi-line).

---

## 4. Variants

Identical token mapping to [Input §4](./input.md) so a Textarea and Input read as the same family.

| Variant | Resting | Use |
|---------|---------|-----|
| `default` | `border border-input bg-background` | Standard form fields |
| `filled` | `bg-muted`, transparent border | Dense forms / busy backgrounds |
| `ghost` | no border/bg until focus | Inline edit (e.g. comment box in a feed) |

**Focus:** `focus-within:ring-2 ring-ring ring-offset-2`. **Invalid:** `border-destructive` +
`focus-within:ring-destructive` (paired with Field's message — never color-only).

---

## 5. Sizes

Controls font + padding + **default min-height** (rows). Radius `rounded-md`.

| Size | Min height | Padding | Font | Use |
|------|-----------|---------|------|-----|
| `sm` | ~64px (3 rows) | 8–12px | `body-sm` | dense panels, table row expand |
| `md` (default) | ~80px (3–4 rows) | 12px | `body-sm` | standard forms |
| `lg` | ~112px (4–5 rows) | 12–16px | `body` | prominent notes / marketing |

---

## 6. States

default / hover / **focus-within** / **invalid** / **disabled** (`opacity-50`, `cursor-not-allowed`,
not focusable) / **readonly** (normal look, focusable, selectable, not editable — e.g. a locked audit
note). Placeholder is `muted-foreground` and is **never** a label.

---

## 7. Behavior

- **Auto-resize:** on input, measure `scrollHeight`, clamp between `minRows` and `maxRows`; beyond the
  ceiling the box stops growing and scrolls. Recompute on mount, value change, and container resize.
  Must be SSR-safe (no layout flash) and not fight controlled values.
- **Newlines vs submit:** `Enter` inserts a newline (never submits). `⌘/Ctrl+Enter` MAY submit when the
  consuming form opts in (Field/form responsibility, not the control).
- **Controlled & uncontrolled** (`value` vs `defaultValue`); works with RHF `register` directly.
- **Counter:** when `maxLength` is set, Field renders a live `current / max` counter (announced politely);
  the control only enforces the native limit.
- **i18n/RTL:** respects `dir`.

---

## 8. Accessibility (acceptance criteria)

- **Always labeled** via `Field` (`<label htmlFor>` ↔ textarea `id`); placeholder is never the label.
- `required` → `aria-required` + visible `*` (Field). `invalid` → `aria-invalid="true"`, error linked via
  `aria-describedby` and announced (`role="alert"`).
- Description/helper and counter linked via `aria-describedby`.
- Auto-resize never traps focus or steals scroll; manual resize grip is keyboard-irrelevant (pointer
  affordance only) and never the sole way to read content.
- Focus-visible ring; AA contrast for text, placeholder, border, error in both themes.

---

## 9. Validation & forms integration

Same model as Input: **one Zod schema** (`@stockflow/types`) drives the RHF resolver *and* the API DTO.
Field maps `errors[name]?.message` → visible/announced error and sets `invalid`. Common rules: `max`
length (mirrors `maxLength`), `trim`, optional `min` for required notes.

---

## 10. `Field` composition

```tsx
<Field label="Description" description="Shown on the product page" error={errors.description?.message}>
  <Textarea autoResize maxLength={500} invalid={!!errors.description} {...register('description')} />
</Field>
```
Field supplies `id`, `htmlFor`, `aria-describedby` (description + counter + error), `aria-invalid`,
the required `*`, and the `count / max` counter.

---

## 11. Testing (plan)

- **Render:** variant/size classes; forwards ref; merges className.
- **Value:** controlled and uncontrolled both update; newline on `Enter`.
- **Auto-resize:** grows with content; stops at `maxRows` and scrolls; respects `minRows` floor.
- **Invalid / disabled / readonly:** styling + `aria-invalid`; disabled blocks edit+focus; readonly blocks
  edit but allows focus/select.
- **RHF:** `register` wires value/onChange/ref; typing updates form state; `maxLength` enforced.
- **A11y:** within `Field`, label association + `aria-describedby` + error `role=alert`; `axe` passes.

---

## 12. Documentation (deliverables)

- **Storybook:** variants × sizes × states; auto-resize; with counter; invalid; disabled; readonly;
  inside `Field`; light + dark. Autodocs props table.
- **MDX do/don't:** always pair with a label (`Field`); placeholder ≠ label; prefer `autoResize` for
  user-generated notes; don't use for single-line values or rich text.

---

## 13. Definition of Done

Typed (no `any`) · all variants/sizes/states · auto-resize (min/max rows) · `invalid` + ARIA hooks ·
controlled+uncontrolled + RHF · accessible (labeled via Field, axe) · Storybook stories · unit +
interaction + a11y tests · MDX docs · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
