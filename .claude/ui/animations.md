# Animations & Motion

> **Status:** 🟡 Seed · **Owner:** Senior UI/UX Designer · **Related:** [design-system](./design-system.md) · [frontend/accessibility](../frontend/accessibility.md)

## Purpose
Purposeful motion that aids understanding without slowing users down.

## Principles
- Motion communicates **state and continuity** (enter/exit, expand/collapse, feedback) — never decoration for its own sake.
- **Fast and subtle:** typical UI transitions 120–240ms; easing tokens (standard, decelerate, accelerate).
- Consistent durations/easings via tokens — no ad-hoc timings.

## Rules
- **Respect `prefers-reduced-motion`** — disable/reduce non-essential animation.
- Animate cheap properties (transform/opacity); avoid layout-thrashing animations.
- Overlays (modal/drawer/popover) use Radix transitions with shared tokens.
- Loading uses skeletons (not spinners) for content; spinners only for short, indeterminate waits.
- Never block interaction waiting for an animation to finish.

## Tokens
`duration-fast/normal/slow`, `ease-standard/in/out`, defined in Phase 4.
