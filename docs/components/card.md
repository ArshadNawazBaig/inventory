# Card — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Card` + parts (`@stockflow/ui` → `primitives/card`) |
| **Status** | ✅ Implemented — composable parts + tests + stories in `packages/ui` (Batch 2 · display) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-26 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [spacing](../../.claude/ui/spacing.md) · [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) · Radix Slot (`asChild`) |

> **Architecture decision:** a **composable surface** (`Card` + `CardHeader`/`CardTitle`/
> `CardDescription`/`CardContent`/`CardFooter`) rather than a monolith with a dozen props. The root owns
> the surface (border/bg/shadow) + vertical rhythm; parts own horizontal padding. `asChild` lets the
> whole card become a link/button for clickable cards.

---

## 1. Overview

The standard content container — used for dashboard tiles, list items, forms, stat blocks, and product
cards. It is the canonical **surface** (`bg-card`), one step lighter than the page background in dark
mode, so nested controls (Input/Select on a Card) read correctly.

---

## 2. Anatomy

```
 ┌─────────────────────────────┐
 │ CardHeader                   │
 │   CardTitle                  │
 │   CardDescription            │
 ├─────────────────────────────┤
 │ CardContent                  │
 ├─────────────────────────────┤
 │ CardFooter (actions)         │
 └─────────────────────────────┘
```
Root spaces the sections with `gap-6` + `py-6`; each part adds `px-6`. Any subset may be used (content
only, header + content, etc.).

---

## 3. API

```ts
type CardVariant = 'default' | 'elevated' | 'ghost';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;   // default 'default'
  interactive?: boolean;   // hover/focus affordance for clickable cards
  asChild?: boolean;       // render the surface onto a child (e.g. <a>)
}

// Parts (each forwards ref + merges className):
CardHeader · CardTitle · CardDescription · CardContent · CardFooter
```

| Variant | Surface | Use |
|---------|---------|-----|
| `default` | `border-border` + `shadow-sm` | Standard cards |
| `elevated` | `shadow-md`, no border | Floating/emphasis tiles |
| `ghost` | transparent, no border/shadow | Grouping without a visible surface |

**Rules:** no `any`; clickable cards use `asChild` (real `<a>`/`<button>`) + `interactive` — don't attach
`onClick` to a bare `<div>`.

---

## 4. States

- **interactive:** `hover:shadow-md`, focus-visible ring, `cursor-pointer`. Focus/keyboard come from the
  underlying element (`asChild` link/button), not a div.
- Nested form controls: `default` Input on a Card reads as a well; on bare page use the `filled` Input.

---

## 5. Accessibility (acceptance criteria)

- A card is a generic container — give it structure with real elements (headings, links). For a clickable
  card use `asChild` so it's a focusable, keyboard-operable `<a>`/`<button>` with an accessible name.
- Don't make a `<div>` clickable; don't bury the only link inside a non-interactive card.
- AA contrast for title/description text on the card surface in both themes.

---

## 6. Testing (plan)

- **Compose:** header/title/description/content/footer all render.
- **Variant:** `elevated` applies `shadow-md`; classes merge with `className`.
- **interactive:** adds hover/cursor/focus affordances.
- **asChild:** renders an anchor with the card styles.
- **Ref:** forwards to the root. **A11y:** `axe` passes for a composed card.

---

## 7. Documentation (deliverables)

- **Storybook:** variants; header/content/footer; with actions; interactive (link) card; product/stat
  examples; light + dark. Autodocs.
- **MDX do/don't:** compose with parts; clickable → `asChild`; ghost for grouping; keep one clear action.

---

## 8. Definition of Done

Typed (no `any`) · variants · composable parts · `asChild` + interactive · accessible (real elements,
axe) · Storybook · unit + a11y tests · MDX docs · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
