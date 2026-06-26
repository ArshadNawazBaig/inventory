# Skeleton — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Skeleton` + `SkeletonText` (`@stockflow/ui` → `primitives/skeleton`) |
| **Status** | ✅ Implemented — placeholder primitives + tests + stories (Batch 7 · feedback) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [Loading](./loading.md) (sibling) |

> **Architecture decision:** Skeleton is the **static, content-shaped** counterpart to [Loading](./loading.md)
> (active spinners/progress). It conveys the *layout* of content that's about to arrive, which reads as
> faster and less jarring than a spinner for known shapes (tables, cards, lists). The base **`Skeleton`** is
> a `bg-muted` block with a `variant` (`rounded`/`circle`/`text`) and an `animation` (`pulse` default,
> `shimmer`, or `none`); you size it with utility classes — so it composes into any shape. **`SkeletonText`**
> is a convenience for multi-line text (last line shortened). Skeletons are **decorative** (`aria-hidden`):
> the loading *state* is announced by the surrounding `aria-busy`/status region, not by each placeholder.
> It's a pure presentational component (no `'use client'`) so it works in RSC loading states. Animations use
> Tailwind's `animate-pulse` and one shimmer keyframe (tokens in globals.css), honouring reduced-motion via
> the base layer. **DataGrid's inline loading rows are refactored onto this.**

---

## 1. Overview

Placeholder blocks shaped like the content they stand in for, shown while data loads. Use them for content
with a predictable shape; use [Loading](./loading.md) (Spinner/Progress) when the shape is unknown or the
wait is measurable.

---

## 2. API

```ts
Skeleton
  variant?: 'rounded' | 'circle' | 'text'  = 'rounded'
  animation?: 'pulse' | 'shimmer' | 'none' = 'pulse'
  // …div props — size/shape with utility classes (e.g. className="h-10 w-10")

SkeletonText
  lines?: number = 3
  animation?: 'pulse' | 'shimmer' | 'none' = 'pulse'
  lastLineWidth?: string = '60%'   // width of the final (shortened) line
  // …div props (wrapper)
```

---

## 3. Behavior

- **Variants:** `rounded` (a block — default), `circle` (avatars/icons), `text` (a text-line bar, full width,
  text-height). Size everything with utility classes (`h-*`, `w-*`, `size-*`).
- **Animation:** `pulse` (opacity, default), `shimmer` (a token sheen sweeping across), or `none`.
- **SkeletonText:** stacks `lines` text bars; the last is `lastLineWidth` wide to mimic a paragraph.
- **Compose freely:** combine a `circle` + `SkeletonText` for a media object, or blocks for a card.

---

## 4. Accessibility (acceptance criteria)

- Placeholders are **decorative** — `aria-hidden="true"` by default — so screen readers don't read empty
  boxes; convey the loading state on the container (`aria-busy="true"` / a status region).
- No colour-only meaning (it's a neutral placeholder); animation honours reduced-motion via the base layer;
  contrast is incidental (muted surface), not informational.

---

## 5. Testing (plan)

- **Base:** renders a `bg-muted` block; default `pulse` animation; `aria-hidden`.
- **Variants:** `circle` → `rounded-full`; `text` → text-height bar; `rounded` → `rounded-md`.
- **Animation:** `shimmer` applies the shimmer classes; `none` applies no animation.
- **SkeletonText:** renders `lines` bars (default 3); honours a custom count; the last line is narrower.
- **A11y:** `axe` passes for Skeleton and SkeletonText.

---

## 6. Documentation (deliverables)

- **Storybook:** variants (rounded/circle/text) · animations (pulse/shimmer/none) · SkeletonText · composed
  examples (media object, card, table rows); light + dark.
- **MDX do/don't:** match the skeleton to the real content's shape/size; don't animate forever — swap to
  content as soon as it's ready; use Skeleton for known shapes and Spinner/Progress otherwise; keep the
  loading state announced on the region, not the placeholders.

---

## 7. Definition of Done

Typed (no `any`) · `Skeleton` (variant × animation) + `SkeletonText` on tokens · decorative `aria-hidden` ·
RSC-safe (no `'use client'`) · reduced-motion via base layer · token-only styling · DataGrid loading rows
refactored onto it · Storybook · unit + a11y tests. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
