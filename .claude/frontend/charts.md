# Charts

> **Status:** 🟡 Seed · **Owner:** Frontend Lead · **Related:** [ui/color-system](../ui/color-system.md) · [accessibility](./accessibility.md)

## Purpose
Consistent, accessible data visualization using Recharts via design-system chart wrappers.

## Rules
- Wrap Recharts in design-system `Chart` components — pages never import Recharts directly.
- Use **semantic color tokens** (not hardcoded hex); must work in light & dark mode.
- Charts are **lazy-loaded** (heavy) and rendered client-side with a skeleton fallback.
- Every chart has: title, legend, accessible summary (`aria-label`/visually-hidden table),
  empty state, and loading state.
- Pre-aggregate data **server-side** (read models) — don't ship raw rows to compute in the browser.
- Responsive containers; sensible tick/label density on small screens.

## Standard charts (dashboard)
- Stock value over time (line/area), movements by type (bar), low-stock count (stat + trend),
  top SKUs (bar), category distribution (donut), ABC/dead-stock (later).

## Accessibility
Provide a data-table equivalent for screen readers; never rely on color alone (use patterns/labels).
