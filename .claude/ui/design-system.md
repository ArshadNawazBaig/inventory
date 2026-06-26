# Design System

> **Status:** 🟡 Seed · **Owner:** Senior UI/UX Designer · **Related:** [DESIGN_SYSTEM.md](../../docs/DESIGN_SYSTEM.md) (canonical, Phase 4) · [components](./components.md)

## Purpose
The foundations every component is built on. Authoritative spec lives in
[`/docs/DESIGN_SYSTEM.md`](../../docs/DESIGN_SYSTEM.md) (Phase 4); this is the working summary.

## Foundations (each has its own file)
- [color-system](./color-system.md) · [typography](./typography.md) · [spacing](./spacing.md)
- [icons](./icons.md) · [animations](./animations.md) · [dark-mode](./dark-mode.md)

## Principles
- **Token-driven:** all visual values come from design tokens (Tailwind v4 theme) — no magic values.
- **Built on Radix + shadcn/ui**, packaged in `@stockflow/ui`. Pages consume; never re-implement.
- **Accessible, responsive, themeable, dark-mode ready** by default.
- Consistency over cleverness — one canonical pattern per problem.

## Token categories
Color (semantic) · Typography scale · Spacing scale · Radius · Shadows/elevation · Breakpoints ·
Motion (durations/easing) · Z-index layers.

## Deliverables
Documented tokens → primitive components → composite components → Storybook stories →
usage guidelines. See [components](./components.md) and [component-rules](./component-rules.md).
