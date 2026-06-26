# Dialog — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Dialog` + parts (`@stockflow/ui` → `primitives/dialog`) |
| **Status** | ✅ Implemented — composable parts + tests + stories in `packages/ui` (Batch 3 · overlays) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [animations](../../.claude/ui/animations.md) · [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) · **Radix Dialog** |

> **Architecture decision:** built on **`@radix-ui/react-dialog`** — it provides the portal, the modal
> focus trap, scroll-lock, `Esc`/overlay dismissal, and `aria-modal` + labelled/described wiring. This is
> the **foundation overlay**: "Modal" is just a Dialog preset, and AlertDialog/Drawer/Sheet are siblings
> built on the same Radix family. A new `--overlay` token provides the scrim (dark in both themes).

---

## 1. Overview

A focused, modal surface for tasks that interrupt the page: create/edit forms, confirmations, details.
Modal by default (blocks the page, traps focus). For **destructive confirmations** prefer an
`AlertDialog` (sibling) so it can't be dismissed by clicking outside.

---

## 2. Anatomy

```
 [Trigger]                              ← DialogTrigger (asChild → your Button)
 ▓▓▓▓▓▓▓▓▓▓▓▓ overlay (scrim) ▓▓▓▓▓▓▓▓  ← DialogOverlay (bg-overlay)
   ┌──────────────────────────────┐ ✕  ← DialogContent (portal, centered) + DialogClose
   │ DialogHeader                  │
   │   DialogTitle                 │   ← names the dialog (required for a11y)
   │   DialogDescription           │
   │ …body…                        │
   │ DialogFooter (actions)        │
   └──────────────────────────────┘
```

---

## 3. API

```ts
type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Root / building blocks (Radix passthrough)
Dialog · DialogTrigger · DialogClose · DialogPortal · DialogOverlay

interface DialogContentProps {
  size?: DialogSize;     // max-width; default 'md'
  showClose?: boolean;   // render the ✕ close button (default true)
}

// Layout helpers
DialogHeader · DialogTitle · DialogDescription · DialogFooter
```

| Size | Max width |
|------|-----------|
| `sm` | 24rem |
| `md` (default) | 32rem |
| `lg` | 42rem |
| `xl` | 56rem |
| `full` | viewport − margin |

`DialogContent` caps height (`max-h-[calc(100vh-2rem)]`) and scrolls long bodies.

---

## 4. Behavior

- **Controlled & uncontrolled** (`open`/`onOpenChange` vs `defaultOpen`); open via `DialogTrigger`
  (`asChild` onto a Button).
- **Dismiss:** `Esc`, overlay click, or `DialogClose` — all close. (AlertDialog disables outside-dismiss.)
- **Focus:** trapped while open; returns to the trigger on close (Radix).
- **Scroll-lock** on the body while open. Portalled to `document.body`.
- **Motion:** respects reduced-motion; enter/exit transitions are a follow-up (kept off until a shared
  keyframe/`tailwindcss-animate` decision — functional without it).

---

## 5. Accessibility (acceptance criteria)

- Always render a **`DialogTitle`** (Radix uses it for `aria-labelledby`; use a visually-hidden title if
  there's no visible one). `DialogDescription` wires `aria-describedby`.
- `role="dialog"` + `aria-modal="true"`; focus trapped and restored; `Esc` closes.
- The ✕ close button has an accessible name ("Close"); decorative icon is `aria-hidden`.
- AA contrast for content text and the scrim in both themes.

---

## 6. Testing (plan)

- **Open/close:** trigger opens; ✕, `Esc`, and overlay click close.
- **Controlled:** `open` renders without a trigger.
- **Size:** `size` sets the max-width class.
- **A11y:** open dialog is `role="dialog"` named by the title; `axe` passes (test the portal).

---

## 7. Documentation (deliverables)

- **Storybook:** trigger + content (form, footer); sizes; controlled; confirm/alert pattern; long-scroll;
  light + dark. Autodocs.
- **MDX do/don't:** always include a title; use AlertDialog for destructive confirms; don't nest dialogs;
  keep one primary action; default focus to the safe action.

---

## 8. Definition of Done

Typed (no `any`) · composable parts · sizes · controlled+uncontrolled · focus trap + scroll-lock +
dismissal (Radix) · accessible (title/description, axe) · Storybook · unit + a11y tests · MDX docs ·
token-only styling (`bg-overlay`). (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
