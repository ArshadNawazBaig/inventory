# Badge — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Badge` (`@stockflow/ui` → `primitives/badge`) |
| **Status** | ✅ Implemented — control + tests + stories in `packages/ui` (Batch 2 · display) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-26 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [color-system](../../.claude/ui/color-system.md) · [ICON_SYSTEM.md](../ICON_SYSTEM.md) · [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) |

> **Architecture decision:** a **non-interactive** label rendered as a `<span>` — no Radix needed. It is
> purely visual/textual; interactive chips (removable filter tags) are a separate future `Tag`. Color is
> a **two-axis** system: `tone` (intent) × `appearance` (soft / solid / outline), all token-mapped so it
> themes automatically.

---

## 1. Overview

A small pill for **status, counts, and categories**: stock status (In stock / Low / Out), order state,
counts (`12`), and labels. Read by screen readers as its text — no extra ARIA.

**Inventory mapping:** In stock → `success`, Low stock → `warning`, Out of stock → `danger`,
Reserved/In transit → `info`, Draft/Neutral → `neutral`.

---

## 2. Anatomy

```
 ┌───────────────────────┐
 │ ● [icon] Label [icon] │   ● optional status dot · icons optional · text = content
 └───────────────────────┘
```

---

## 3. Props (design contract)

```ts
type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeAppearance = 'soft' | 'solid' | 'outline';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;             // default 'neutral'
  appearance?: BadgeAppearance; // default 'soft'
  size?: BadgeSize;             // default 'md'
  dot?: boolean;                // leading status dot (inherits the tone colour)
  leadingIcon?: LucideIcon;     // decorative
  trailingIcon?: LucideIcon;    // decorative
}
```

**Rules:** no `any`; non-interactive (don't attach click handlers — use a Button/Tag); icons + dot are
`aria-hidden`; meaning must be in the **text**, never color/dot alone.

---

## 4. Tone × appearance

| | soft (default) | solid | outline |
|--|----------------|-------|---------|
| **neutral** | `bg-muted` | `bg-foreground` | `border-border` |
| **primary/success/warning/danger/info** | `bg-{tone}/12` + `text-{tone}` | `bg-{tone}` + `text-{tone}-foreground` | `border-{tone}/40` + `text-{tone}` |

**soft** is the default for status (subtle, readable in tables). **solid** for counts/emphasis.
**outline** for quiet category labels.

---

## 5. Sizes

| Size | Height | Padding-x | Font | Icon/dot |
|------|--------|-----------|------|----------|
| `sm` | 20px | 8px | 11px | 12px / 6px |
| `md` (default) | 24px | 10px | 12px | 12px / 6px |

Radius `rounded-full`; numeric badges use `tabular-nums` via the caller if needed.

---

## 6. Accessibility

- The **text carries the meaning** — color/dot are redundant cues (`aria-hidden`).
- AA contrast for text on its background in both themes (soft tints tuned for this).
- Non-interactive: not focusable; if a badge must be clickable, wrap/replace with a Button or Tag.

---

## 7. Testing (plan)

- **Render:** children text; tone/appearance/size classes applied.
- **Adornments:** `dot` renders a leading dot; leading/trailing icons render (`aria-hidden`).
- **Ref:** forwards to the span.
- **A11y:** `axe` passes; no interactive semantics.

---

## 8. Documentation (deliverables)

- **Storybook:** tones × appearances; with dot (status) / icon; sizes; inventory status set; light + dark.
- **MDX do/don't:** meaning in text not color; soft for status, solid for counts; don't make it clickable.

---

## 9. Definition of Done

Typed (no `any`) · tone × appearance × size · dot + icons · accessible (text-first, axe) · Storybook ·
unit + a11y tests · MDX docs · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
