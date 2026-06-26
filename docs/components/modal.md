# Modal — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Modal` (`@stockflow/ui` → `primitives/modal`) |
| **Status** | ✅ Implemented — convenience wrapper + tests + stories in `packages/ui` (Batch 3 · overlays) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [dialog.md](./dialog.md) (the primitive this delegates to) |

> **Architecture decision:** `Modal` is **not** a separate overlay — it is a **prop-driven preset built on
> [Dialog](./dialog.md)**. It bundles the everyday pattern (title + description + body + footer + size +
> close) into one component so callers don't wire six parts each time. All overlay behavior (portal, focus
> trap, scroll-lock, `Esc`/overlay dismissal, ARIA) comes from Dialog/Radix — Modal adds **zero** new
> overlay logic. Reach for **Dialog** directly when you need full control (custom header layout, multiple
> sections, an action in the header, etc.).

---

## 1. When to use which

| Need | Use |
|------|-----|
| Standard "title + content + Cancel/Confirm" modal | **`Modal`** (this) |
| Custom structure, header action, non-standard layout | **[Dialog](./dialog.md)** parts |
| Destructive confirm that must not dismiss on outside-click | **AlertDialog** (sibling, future) |

---

## 2. API

```ts
interface ModalProps {
  open?: boolean;                         // controlled
  defaultOpen?: boolean;                  // uncontrolled
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;                    // a single element; wrapped in DialogTrigger asChild
  title: ReactNode;                       // required (accessible name)
  description?: ReactNode;
  size?: DialogSize;                      // 'sm' | 'md' | 'lg' | 'xl' | 'full' (default 'md')
  showClose?: boolean;                    // ✕ button (default true)
  footer?: ReactNode;                     // action buttons (e.g. Cancel / Save)
  children?: ReactNode;                   // body
}
```

Maps 1:1 onto Dialog: `trigger`→`DialogTrigger`, `title`/`description`→`DialogHeader` + `DialogTitle`/
`DialogDescription`, `children`→body, `footer`→`DialogFooter`. `size`/`showClose`→`DialogContent`.

---

## 3. Accessibility

Inherits everything from [Dialog §5](./dialog.md): `role="dialog"` + `aria-modal`, focus trap + restore,
`Esc`/overlay close, title-as-accessible-name (`title` is **required**), description wiring.

---

## 4. Testing (plan)

- **Open:** `trigger` opens; title/description/body/footer render.
- **Controlled:** `open` renders without a trigger.
- **Size:** forwards to the content max-width.
- **A11y:** open modal is `role="dialog"` named by `title`; `axe` passes.

---

## 5. Definition of Done

Typed (no `any`) · delegates fully to Dialog (no new overlay logic) · title/description/footer/size/close ·
controlled+uncontrolled · accessible (inherited) · Storybook · unit + a11y tests · MDX docs.
(Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
