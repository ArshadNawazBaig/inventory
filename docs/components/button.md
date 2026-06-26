# Button — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Button` (`@stockflow/ui` → `primitives/button`) |
| **Status** | ✅ Implemented — component + variants + tests (12) + stories in `packages/ui` |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-26 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [ICON_SYSTEM.md](../ICON_SYSTEM.md) · [ANIMATION_GUIDELINES.md](../ANIMATION_GUIDELINES.md) · [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) |

> This is the **first component spec and the template** all future components follow:
> Overview → Anatomy → Props → Variants → Sizes → States → Loading → Icons → Disabled →
> Accessibility → Testing → Documentation.

---

## 1. Overview

The primary interactive control for **actions** (submit, save, delete, open dialog). For
**navigation**, render an anchor via `asChild` (see §10) — never fake a link with a button.

**Guidelines**
- One **primary** button per view/section; everything else is secondary/ghost/outline.
- `destructive` only for irreversible/dangerous actions, always with a confirming label.
- Labels are short **verbs** ("Save", "Create product", "Delete") — not "OK"/"Submit here".

---

## 2. Anatomy

```
┌─────────────────────────────────────────┐
│  [leadingIcon]  Label / children  [trailingIcon]  │
└─────────────────────────────────────────┘
   ▲ spinner replaces leadingIcon when loading
```
Slots: optional **leading icon**, **label** (children), optional **trailing icon**. In `size="icon"`
the label is visually omitted and provided via `aria-label`. When `loading`, a spinner takes the
leading slot.

---

## 3. Props (design contract — not implementation)

```ts
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from '@stockflow/icons';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;      // default 'primary'
  size?: ButtonSize;            // default 'md'
  asChild?: boolean;            // render via Radix Slot (e.g., as <a>); default false
  leadingIcon?: LucideIcon;     // icon component (decorative)
  trailingIcon?: LucideIcon;    // icon component (decorative)
  loading?: boolean;            // shows spinner + busy state; default false
  loadingText?: string;         // optional label shown/announced while loading
  fullWidth?: boolean;          // stretch to container width; default false
  // children: the label. type defaults to 'button' (not 'submit').
  // ...native button attributes (onClick, disabled, type, form, aria-*) are passed through.
  // ref is forwarded to the underlying <button>.
}
```

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `ButtonVariant` | `primary` | Visual intent → semantic tokens (§4) |
| `size` | `ButtonSize` | `md` | Height/padding/font/icon size (§5) |
| `asChild` | `boolean` | `false` | Polymorphism via Radix `Slot` (links, menu items) |
| `leadingIcon` / `trailingIcon` | `LucideIcon` | — | From `@stockflow/icons`; auto-`aria-hidden` |
| `loading` | `boolean` | `false` | Spinner + `aria-busy`; blocks interaction (§7) |
| `loadingText` | `string` | — | Replaces/announces label while loading |
| `fullWidth` | `boolean` | `false` | `w-full` |
| `disabled` | `boolean` (native) | `false` | Native `disabled` (§9) |
| `type` | `'button'\|'submit'\|'reset'` | `button` | Prevents accidental form submit |
| `className` | `string` | — | Merged via `cn` (escape hatch; tokens preferred) |

**Design rules:** no `any`; `leadingIcon`/`trailingIcon` are component refs (not rendered elements);
`className` is for layout overrides, not re-theming.

---

## 4. Variants

Each maps to **semantic tokens** (auto light/dark). Transitions use `--duration-fast` on
background/color only (no layout). Every variant shows a visible `focus-visible` ring.

| Variant | Resting | Hover | Use |
|---------|---------|-------|-----|
| `primary` | `bg-primary` / `text-primary-foreground` | darken (`brand-700`) | The main CTA |
| `secondary` | `bg-secondary` / `text-secondary-foreground` | `accent` | Secondary action |
| `outline` | `border-input bg-background` | `bg-accent` | Low emphasis, bordered |
| `ghost` | transparent | `bg-accent` | Toolbar / table row actions |
| `destructive` | `bg-destructive` / `text-destructive-foreground` | darken (`danger-700`) | Irreversible/dangerous |
| `link` | `text-primary`, underline on hover, no bg/padding | underline | Inline navigation/affordance |

> Extensible: a `success`/tone variant can be added later via the same token pattern. Don't add
> one-off colors — go through tokens.

---

## 5. Sizes

Heights align to the 4px grid; radius `rounded-md`; icon sizes from the icon scale.

| Size | Height | Padding-x | Font | Icon | Notes |
|------|--------|-----------|------|------|-------|
| `sm` | 32px | 12px | `body-sm` | 16px (`size-4`) | dense toolbars/tables |
| `md` (default) | 36–40px | 16px | `body-sm` | 16–20px | standard |
| `lg` | 44px | 24px | `body` | 20px (`size-5`) | prominent CTAs; meets 44px touch target |
| `icon` | square (= matching height) | 0 (centered) | — | matches size | **icon-only — requires `aria-label`** |

- `gap` between icon and label: 6–8px (`gap-1.5`/`gap-2`).
- Touch: `lg` meets 44×44; `sm`/`md` need adequate surrounding spacing on touch surfaces.

---

## 6. States

Defined for **every** variant × size: default, **hover**, **active** (subtle press,
`active:scale-[0.98]`), **focus-visible** (ring `--ring`, 2px + 2px offset), **disabled** (§9),
**loading** (§7). No layout shift between states.

---

## 7. Loading

- `loading` shows a spinner (`Loader2` from `@stockflow/icons`, `animate-spin`) in the **leading
  slot**, replacing `leadingIcon`.
- **Width is preserved** — the label stays (or swaps to `loadingText`) so the button doesn't resize;
  no layout jump.
- **Interaction blocked** while loading (clicks are no-ops) to prevent double-submit; visually
  distinct from `disabled` (spinner, not just dimmed).
- A11y: `aria-busy="true"`; the button keeps an accessible name; spinner is `aria-hidden`; if
  `loadingText` is set, announce it politely.
- `prefers-reduced-motion`: spinner remains (functional feedback) but is the only motion.

---

## 8. Icons

- `leadingIcon`/`trailingIcon` are `LucideIcon` components from `@stockflow/icons`, sized to the
  button size, colored via `currentColor`, and **`aria-hidden`** (the label conveys meaning).
- **Icon-only** = `size="icon"` + an icon + **required `aria-label`** + a tooltip (recommended).
- During `loading`, the leading icon is replaced by the spinner.
- Never inline raw SVGs; always use the icon package (see [ICON_SYSTEM.md](../ICON_SYSTEM.md)).

---

## 9. Disabled

- Default: native `disabled` attribute → not clickable, not focusable; visual `opacity-50` +
  `cursor-not-allowed`; no hover/active animation.
- **"Disabled with a reason"** (need a tooltip explaining why): use `aria-disabled="true"` +
  prevent the action in the handler so the control **stays focusable/hoverable** for the tooltip.
  Documented as a pattern; native `disabled` remains the default.
- `loading` implies non-interactive but is a distinct state (don't also dim like disabled).

---

## 10. Polymorphism (`asChild`)

- `asChild` renders the styling onto a child element via Radix `Slot` — e.g.
  `<Button asChild><a href="/products">Products</a></Button>` → a styled **anchor** with correct
  link semantics and keyboard behavior. Use this whenever the action is navigation.

---

## 11. Accessibility (acceptance criteria)

- Renders a native `<button>` (or the `asChild` element); `type` defaults to `button`.
- Keyboard: Enter/Space activate; visible `focus-visible` ring; outline never removed without replacement.
- Icon-only buttons have an accessible name (`aria-label`); decorative icons are `aria-hidden`.
- Loading sets `aria-busy` and preserves the accessible name.
- Contrast: each variant meets **WCAG AA** in light and dark.
- State is never conveyed by color alone (destructive pairs color + label/icon).
- Disabled semantics are correct for the chosen pattern (native vs `aria-disabled`).

---

## 12. Testing (plan — to run once implemented)

**Unit/render**
- Renders children; applies correct classes per `variant`/`size`; forwards `ref`; merges `className`;
  `type` defaults to `button`; `fullWidth` applies width.

**Interaction**
- `onClick` fires on click and on Enter/Space; **does not** fire when `disabled` or `loading`.

**Loading**
- Shows spinner; sets `aria-busy`; blocks click; shows/announces `loadingText`; width unchanged.

**Icons**
- Leading/trailing icons render and are `aria-hidden`; leading icon is replaced by spinner when loading.

**Disabled**
- Native `disabled` set; no `onClick`; correct styling. `aria-disabled` pattern stays focusable.

**Polymorphism**
- `asChild` renders an `<a>` with `href`, retains styles, has link role/keyboard semantics.

**Accessibility**
- `axe` passes for every variant; `size="icon"` without an accessible name fails the a11y test
  (guard against unlabeled icon buttons); focus-visible ring present.

**Visual**
- Storybook visual-regression snapshots across variants × sizes × states (incl. dark mode).

---

## 13. Documentation (deliverables with the component)

- **Storybook stories:** every variant; every size; with leading/trailing icon; icon-only; loading;
  disabled; `fullWidth`; `asChild` as link; light + dark. Autodocs props table from the types.
- **MDX docs:** anatomy diagram, props table, **do/don't** (e.g., one primary per view; use `link`/
  `asChild` for navigation; destructive needs confirmation), content guidelines (verb labels),
  and accessibility notes.
- Linked from the design system and `COMPONENT_LIBRARY.md` inventory.

---

## 14. Definition of Done
Typed (no `any`) · all variants/sizes/states · accessible (keyboard + axe + labeled icon-only) ·
loading + disabled handled · Storybook stories · unit + interaction + a11y tests · MDX docs ·
token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
