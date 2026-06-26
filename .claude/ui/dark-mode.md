# Dark Mode

> **Status:** 🟡 Seed · **Owner:** Senior UI/UX Designer · **Related:** [color-system](./color-system.md) · [design-system](./design-system.md)

## Purpose
First-class light and dark themes from a single set of semantic tokens.

## Principles
- Light and dark are **two mappings of the same semantic roles** (see [color-system](./color-system.md)).
- Components reference roles only, so they work in both themes with zero per-component branching.
- Default to system preference; allow user override; persist the choice.

## Rules
- Verify **AA contrast in both themes** for every text/surface pair and status color.
- Avoid pure black/white; use tuned neutrals to reduce eye strain.
- Elevation in dark mode uses lighter surfaces (not just shadows) to convey depth.
- Images/illustrations have dark-mode-safe variants or treatments.
- Charts pull theme-aware token colors. See [frontend/charts](../frontend/charts.md).

## Implementation
- Theme applied via a root class/attribute; tokens swap via CSS variables (Tailwind v4).
- No flash of incorrect theme (set before hydration).
