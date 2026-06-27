# Field

| | |
|---|---|
| **Component** | `Field` (+ `FieldLabel`, `FieldDescription`, `FieldError`, `FieldControl`) |
| **Package** | `@stockflow/ui` |
| **Status** | ✅ Implemented (8 tests + stories) |
| **Source** | [`packages/ui/src/primitives/field`](../../packages/ui/src/primitives/field) |

The accessible **label / description / error host** that every form control composes into. It owns the
generated ids and wires `htmlFor`, `aria-describedby`, `aria-invalid`, and `aria-required` so application
pages never hand-roll that markup — satisfying the cardinal rule that *all UI comes from `@stockflow/ui`*.
`Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, and `Radio` are intentionally **bare**; `Field` is
where their labels and messages live.

## Anatomy

```
<Field label error description required>      // owns ids + invalid state, lays out the parts
  <FieldLabel>          → <label htmlFor={controlId}>  (+ required *)
  <FieldControl>        → clones the control with id + aria wiring (and invalid on error)
  <FieldDescription>    → <p id={descriptionId}>       (hidden while an error shows)
  <FieldError>          → <p id={errorId} aria-live="polite">
</Field>
```

`Field` renders the label / description / error from props automatically; you only place the control
inside a single `<FieldControl>`. The sub-parts are exported for fully custom layouts.

## Usage

```tsx
import { Field, FieldControl, Input, Select, SelectTrigger, SelectContent, SelectItem } from '@stockflow/ui';

// Native control — register() supplies name/onChange/ref; Field supplies id + aria.
<Field label="SKU" required description="Letters, numbers, hyphens." error={errors.sku?.message}>
  <FieldControl>
    <Input {...register('sku')} />
  </FieldControl>
</Field>

// Radix control — wrap the *trigger* (the focusable element), not the root.
<Field label="Status" error={errors.status?.message}>
  <Select value={field.value} onValueChange={field.onChange}>
    <FieldControl>
      <SelectTrigger placeholder="Select a status" />
    </FieldControl>
    <SelectContent>
      <SelectItem value="active">Active</SelectItem>
    </SelectContent>
  </Select>
</Field>
```

## Props (`Field`)

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `label` | `ReactNode` | — | Visible label, associated with the control. |
| `description` | `ReactNode` | — | Hint linked via `aria-describedby`; hidden while an error shows. |
| `error` | `ReactNode` | — | Presence flips the control to invalid and is announced (`aria-live="polite"`). |
| `required` | `boolean` | `false` | Renders `*` and sets `aria-required` on the control. |
| `htmlFor` | `string` | auto (`useId`) | Override the generated control id. |
| `children` | `ReactNode` | — | Must contain a single `<FieldControl>`. |

`...rest` spreads onto the wrapping `<div>`.

## Accessibility

- The control is always **named** by its `<label>` (`htmlFor` ↔ `id`).
- `aria-describedby` references the **error** when present, otherwise the **description**.
- On error the control receives `aria-invalid="true"` and the visual `invalid` state in one place.
- Required controls get `aria-required="true"`; the `*` is `aria-hidden` (decorative).
- A part used outside `<Field>` throws — failing loudly rather than shipping an unlabelled control.

## Guidelines

- One control per `Field`. For groups (radio/checkbox sets) use a `fieldset`/`legend` pattern (future
  `FieldSet`).
- Wrap the **focusable** element in `FieldControl` — for `Select` that is `SelectTrigger`.
- Prefer `error={fieldState.error?.message}` from React Hook Form; the message string is the contract.
- A placeholder is **not** a label — always pass `label` (or compose `FieldLabel`).
