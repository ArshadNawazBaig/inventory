# Popover — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Popover` + parts (`@stockflow/ui` → `primitives/popover`) |
| **Status** | ✅ Implemented — composable parts + tests + stories in `packages/ui` (Batch 3 · overlays) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [dialog.md](./dialog.md) (sibling overlay) · **Radix Popover** |

> **Architecture decision:** built on **`@radix-ui/react-popover`** — a **non-modal** floating panel
> anchored to a trigger, with collision-aware positioning. Unlike [Dialog](./dialog.md) it does **not**
> scrim the page or trap focus; the page stays usable. It shares the portal foundation with Dialog.

---

## 1. Scope — Popover vs Dropdown vs Tooltip

| Need | Component |
|------|-----------|
| **Rich content** on click (form, filters, info, color picker) | **`Popover`** *(this)* |
| A **menu of actions** (keyboard menu semantics, items) | **Dropdown** *(future)* |
| **Brief hover text** (label/hint, no focusable content) | **Tooltip** *(future)* |
| Page-blocking task / confirmation | **[Dialog](./dialog.md)** |

---

## 2. Anatomy

```
 [Trigger]                         ← PopoverTrigger (asChild → your Button)
   ┌───────────────────────┐
   │ …rich content…        │ ✕     ← PopoverContent (portal, positioned) + optional PopoverClose
   │                      ◣ │       ← optional PopoverArrow (showArrow)
   └───────────────────────┘
```

---

## 3. API

```ts
// Radix passthrough
Popover · PopoverTrigger · PopoverAnchor · PopoverClose

interface PopoverContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left';     // default 'bottom'
  align?: 'start' | 'center' | 'end';             // default 'center'
  sideOffset?: number;                            // default 8
  showArrow?: boolean;                            // default false
  // ...Radix Content props (collisionPadding, onOpenAutoFocus, etc.)
}
```

Default width `w-72` (override via `className`); positioning is collision-aware and exposes
`--radix-popover-content-available-height` for scroll-capping.

---

## 4. Behavior

- **Non-modal:** the page is not scrimmed and focus is **not trapped**; clicking outside or `Esc` closes.
- **Controlled & uncontrolled** (`open`/`onOpenChange` vs `defaultOpen`); open via `PopoverTrigger`.
- **Positioning:** `side`/`align`/`sideOffset`, flips/shifts to stay in view; `PopoverAnchor` lets the
  panel anchor to a different element than the trigger.
- **Focus:** moves into the content on open and returns to the trigger on close (Radix), without trapping.

---

## 5. Accessibility (acceptance criteria)

- `PopoverTrigger` must have an accessible name; Radix sets `aria-expanded`/`aria-controls` and links the
  content `id`.
- `PopoverContent` is `role="dialog"`, so it **must have an accessible name** — give it `aria-label`, or
  `aria-labelledby` pointing at its heading (just like Dialog's title).
- Focusable content is reachable; `Esc` and outside-click close and restore focus to the trigger.
- The arrow is decorative; the ✕ close button (if used) has an accessible name.
- AA contrast for content text on `bg-popover` in both themes.

---

## 6. Testing (plan)

- **Open/close:** trigger opens; `Esc`, outside-click, and `PopoverClose` close.
- **Controlled:** `open` renders without a trigger click.
- **Positioning props:** `side`/`align` forwarded (data attributes).
- **A11y:** trigger named, `aria-expanded` toggles; `axe` passes for the open panel.

---

## 7. Documentation (deliverables)

- **Storybook:** info popover; form/filter popover; alignments/sides; with arrow; controlled; light + dark.
- **MDX do/don't:** Popover (rich) vs Dropdown (actions) vs Tooltip (hint); non-modal — don't use for
  blocking tasks (use Dialog); always name the trigger.

---

## 8. Definition of Done

Typed (no `any`) · composable parts · side/align/offset + optional arrow · controlled+uncontrolled ·
non-modal dismissal + focus return (Radix) · accessible (axe) · Storybook · unit + a11y tests · MDX docs ·
token-only styling (`bg-popover`). (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
