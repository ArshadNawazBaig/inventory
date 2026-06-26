# Avatar — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Avatar` + `AvatarGroup` (`@stockflow/ui` → `primitives/avatar`) |
| **Status** | ✅ Implemented — control + tests + stories in `packages/ui` (Batch 2 · display) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-26 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [ICON_SYSTEM.md](../ICON_SYSTEM.md) · [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) · **Radix Avatar** |

> **Architecture decision:** built on **`@radix-ui/react-avatar`** for robust image loading with an
> automatic fallback (it tracks load/error and swaps to the fallback without a flash of broken image).
> We skin it with tokens and add **sizes, shape, a status dot, and `AvatarGroup`** (overlapping stack
> with `+N` overflow).

---

## 1. Overview

Represents a person or entity (user, supplier contact, team member) as an image with a graceful
fallback to **initials** (derived from a name) or a generic **user icon**. Used in tables ("created
by"), assignment pickers, member lists, headers, and comments.

---

## 2. Anatomy

```
 ┌────────┐
 │  img   │   ← Radix Image (clipped to circle/square); falls back automatically
 │ or "JD"│   ← Fallback: initials from `name`, or UserIcon, or custom node
 └────────┘●  ← optional status dot (online/offline/away/busy) + sr-only label
```

`AvatarGroup` overlaps several avatars (`-space-x`) with a `ring-background` separator and renders a
trailing **`+N`** avatar past `max`.

---

## 3. Props (design contract)

```ts
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';   // 24 / 32 / 40 / 48 / 64 px
type AvatarShape = 'circle' | 'square';
type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

interface AvatarProps {
  src?: string;            // image URL
  alt?: string;            // image alt (defaults to `name`)
  name?: string;           // derives initials + provides the accessible name (role="img")
  fallback?: ReactNode;    // override the fallback (e.g. a custom icon)
  size?: AvatarSize;       // default 'md' (or inherited from AvatarGroup)
  shape?: AvatarShape;     // default 'circle'
  status?: AvatarStatus;   // optional status dot
}

interface AvatarGroupProps {
  max?: number;            // show up to `max`, then a +N avatar (default: all)
  size?: AvatarSize;       // applied to all children via context
}
```

**Rules:** no `any`; when `name`/`alt` is provided the root is `role="img"` with `aria-label` and the
inner image/fallback are decorative (no double announcement); with neither, the avatar is decorative.

---

## 4. Sizes & shape

| Size | Box | Text | Icon | Status dot |
|------|-----|------|------|-----------|
| `xs` | 24px | 10px | 12px | 6px |
| `sm` | 32px | 12px | 16px | 8px |
| `md` (default) | 40px | 14px | 20px | 10px |
| `lg` | 48px | 16px | 24px | 12px |
| `xl` | 64px | 18px | 32px | 14px |

Shape: `circle` (`rounded-full`, default) or `square` (`rounded-md`). The status dot sits bottom-right
with a `ring-2 ring-background` so it reads on any surface.

---

## 5. Fallback behavior

1. **Image** if `src` loads.
2. **Initials** from `name` (first + last initial, or first two letters of a single word).
3. **`UserIcon`** if there is no name.
4. **Custom** via `fallback`.

Fallback color is `bg-muted` / `text-muted-foreground` (theme-aware). No flash of broken image — Radix
shows the fallback until the image is confirmed loaded.

---

## 6. Status dot

`online` → `success`, `offline` → `muted-foreground`, `away` → `warning`, `busy` → `destructive`.
Paired with a visually-hidden text label so the state is announced, never color-only.

---

## 7. AvatarGroup

Overlapping stack for "5 members" style displays. `max` caps the visible count and appends a `+N`
avatar (itself accessible, e.g. "2 more"). Children inherit `size` from the group; each gets a
`ring-background` ring so overlaps stay legible on any background.

---

## 8. Accessibility (acceptance criteria)

- Named avatars expose `role="img"` + `aria-label` (the name); decorative avatars are skipped by SR.
- Status is conveyed by the dot **plus** a visually-hidden label — never color alone.
- Initials/icon fallbacks are decorative (`aria-hidden`) so the name isn't read twice.
- AA contrast for initials on the fallback surface in both themes.

---

## 9. Testing (plan)

- **Fallback:** initials derived from `name`; custom fallback renders; `UserIcon` when no name.
- **A11y:** named avatar is `role="img"` with the name; `axe` passes; status exposes a text label.
- **Group:** renders up to `max` then a `+N`; `+N` count correct; children inherit size.
- **Ref:** forwards to the root.

---

## 10. Documentation (deliverables)

- **Storybook:** sizes × shapes; image vs initials vs icon fallback; all statuses; group with overflow;
  light + dark. Autodocs.
- **MDX do/don't:** always provide `name`/`alt` for meaningful avatars; pair status with text; use
  `AvatarGroup` for member stacks rather than ad-hoc overlap.

---

## 11. Definition of Done

Typed (no `any`) · sizes × shapes · image/initials/icon/custom fallback · status dot (+ sr-only) ·
`AvatarGroup` with `+N` overflow · accessible (role/aria, axe) · Storybook stories · unit + a11y tests ·
MDX docs · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
