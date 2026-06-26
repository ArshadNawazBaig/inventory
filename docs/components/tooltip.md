# Tooltip — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Tooltip` (+ parts) (`@stockflow/ui` → `primitives/tooltip`) |
| **Status** | ✅ Implemented — convenience + parts + tests + stories in `packages/ui` (Batch 3 · overlays) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [popover.md](./popover.md) (sibling) · **Radix Tooltip** |

> **Architecture decision:** built on **`@radix-ui/react-tooltip`**. Shipped as a **convenience
> `Tooltip`** (`<Tooltip content>…trigger…</Tooltip>`) for the dominant case, plus the composable parts
> (`TooltipProvider`/`TooltipRoot`/`TooltipTrigger`/`TooltipContent`) for control. The convenience bundles
> a `TooltipProvider`, so it works standalone; mount one `TooltipProvider` at the app root for shared
> open/skip-delay coordination.

---

## 1. Scope

A **brief, non-interactive hint** shown on hover **and** keyboard focus — icon-button labels, truncated
text, terse help. **Not** for essential information, long content, or anything interactive (use
[Popover](./popover.md)); not a substitute for a visible label on a form control (use `Field`).

---

## 2. API

```ts
// Convenience (primary)
interface TooltipProps {
  content: ReactNode;                              // the hint
  children: ReactNode;                             // the trigger (single focusable element)
  side?: 'top' | 'right' | 'bottom' | 'left';      // default 'top'
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;                             // default 6
  delayDuration?: number;                          // default 200ms
  showArrow?: boolean;                             // default true
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
}

// Composable parts
TooltipProvider · TooltipRoot · TooltipTrigger · TooltipContent
```

Content is **inverted** for contrast (`bg-foreground` / `text-background`) — dark-on-light theme,
light-on-dark theme — `max-w-xs`, optional arrow.

---

## 3. Behavior

- Opens on **hover** (after `delayDuration`) and on **focus** (immediately); closes on leave, blur, `Esc`,
  or scroll. Portalled + collision-aware.
- The trigger must be **focusable** (a real button/link). Tooltips on a disabled control won't fire — wrap
  an enabled element, or convey the info another way.
- Controlled via `open`/`onOpenChange` when needed (rare).

---

## 4. Accessibility (acceptance criteria)

- Radix links the tip to the trigger via `aria-describedby` and gives the content `role="tooltip"`.
- Available on **keyboard focus**, not hover-only; `Esc` dismisses.
- The tooltip **describes** a trigger that already has its own accessible name — it is never the *only*
  name for an icon-only control that needs one (give such controls an `aria-label` too).
- AA contrast for the inverted content in both themes.

---

## 5. Testing (plan)

- **Hover:** shows the tip (`role="tooltip"`) after delay.
- **Focus:** shows on keyboard focus.
- **Dismiss:** hides on unhover/`Esc`.
- **A11y:** `axe` passes while open; trigger is `aria-describedby` the tip.

---

## 6. Documentation (deliverables)

- **Storybook:** icon-button label; text trigger; sides; with/without arrow; long text wrap; light + dark.
- **MDX do/don't:** hints only (not essential info or interactive content → Popover); ensure the trigger is
  focusable + named; don't tooltip a disabled control.

---

## 7. Definition of Done

Typed (no `any`) · convenience + composable parts · side/align/offset/delay + optional arrow ·
hover + focus + dismiss (Radix) · accessible (`role=tooltip`, `aria-describedby`, axe) · Storybook ·
unit + a11y tests · MDX docs · token-only styling (inverted). (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
