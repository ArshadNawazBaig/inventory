# Loading — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Spinner` · `Progress` · `LoadingOverlay` (`@stockflow/ui` → `primitives/loading`) |
| **Status** | ✅ Implemented — spinner + progress + overlay + tests + stories (Batch 7 · feedback) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · `@stockflow/icons` |

> **Architecture decision:** "Loading" is the **active-indicator family** — motion that says *work is in
> progress* — as opposed to [Skeleton](./skeleton.md) (static content placeholders, next). Three
> token-driven primitives: **`Spinner`** (a `currentColor` SVG that inherits text colour, sized; the
> default inline busy indicator), **`Progress`** (a linear bar, **determinate** by `value` or
> **indeterminate** when omitted — the determinate form is what File/Image Upload feed), and
> **`LoadingOverlay`** (a dimmed, optionally blurred cover for a section or the viewport with a centred
> spinner + message). Each carries the right ARIA (`role="status"` / `role="progressbar"` / `aria-busy`).
> Animations use Tailwind's `animate-spin` and one indeterminate keyframe (tokens in globals.css); all
> honour reduced-motion via the base layer.

---

## 1. Overview

Indicators for in-flight work: a spinner for buttons/inline/areas, a progress bar for measurable tasks
(uploads, imports, reports), and an overlay to block a panel or the page while it loads.

---

## 2. API

```ts
Spinner
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'  = 'md'
  label?: string                            = 'Loading'   // accessible name (role="status")
  // …svg props (className inherits colour via currentColor)

Progress
  value?: number                 // 0..max ⇒ determinate; omit ⇒ indeterminate
  max?: number = 100
  size?: 'sm' | 'md' | 'lg' = 'md'
  tone?: 'primary' | 'success' | 'warning' | 'error' = 'primary'
  label?: string = 'Loading'     // accessible name (role="progressbar")
  // …div props

LoadingOverlay
  show?: boolean = true          // render nothing when false
  label?: ReactNode              // message under the spinner
  fullscreen?: boolean = false   // fixed inset-0 vs absolute inset-0 (cover a relative parent)
  blur?: boolean = false         // backdrop blur
  spinnerSize?: Spinner['size'] = 'lg'
  // …div props
```

---

## 3. Behavior

- **Spinner:** rotates (`animate-spin`); colour is `currentColor` so it matches its context (e.g. a button).
  Sizes `xs`–`xl`. Standalone it announces via `role="status"` + `aria-label`.
- **Progress:** with `value` it fills to `value/max` and animates width; without `value` it shows an
  indeterminate sliding bar. Tone sets the bar colour; size sets the track height. Values are clamped.
- **LoadingOverlay:** absolutely covers its nearest `relative` ancestor (or the viewport when `fullscreen`),
  dims (`bg-background/70`, optional blur), centres a spinner + optional message, and blocks interaction.
  Renders `null` when `show` is false.

---

## 4. Accessibility (acceptance criteria)

- Spinner: `role="status"` with an accessible name (`label`, default "Loading"); when decorative inside a
  labelled context it can be `aria-hidden`.
- Progress: `role="progressbar"` with `aria-valuemin/max` and `aria-valuenow` (omitted while indeterminate);
  named via `label`/`aria-labelledby`.
- Overlay: `role="status"` + `aria-busy="true"` so the loading state is announced; spinner inside is
  decorative to avoid double announcement. Motion honours reduced-motion (base layer); colour is never the
  only signal (role/text convey state). AA contrast both themes.

---

## 5. Testing (plan)

- **Spinner:** exposes `role="status"` with the default/﻿custom accessible name; size class applied.
- **Progress (determinate):** `role="progressbar"` with `aria-valuenow`; clamps out-of-range values; tone
  class applied.
- **Progress (indeterminate):** omits `aria-valuenow` but keeps the progressbar role.
- **Overlay:** renders when `show` (default) with `aria-busy`; renders nothing when `show={false}`; shows
  the message.
- **A11y:** `axe` passes for spinner, progress, and overlay.

---

## 6. Documentation (deliverables)

- **Storybook:** spinner sizes + in-button + coloured; progress determinate (values)/indeterminate/tones/
  sizes; overlay over a card + fullscreen; light + dark.
- **MDX do/don't:** use Progress when you know the percentage, Spinner when you don't; use Skeleton (not a
  spinner) for content that has a known shape; don't block the whole screen for a small async action — scope
  the overlay; always pair an indicator with an accessible label.

---

## 7. Definition of Done

Typed (no `any`) · Spinner/Progress/LoadingOverlay on tokens · determinate + indeterminate progress · overlay
(scoped + fullscreen, blur) · correct ARIA (status/progressbar/aria-busy) · reduced-motion via base layer ·
token-only styling · Storybook · unit + a11y tests. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
