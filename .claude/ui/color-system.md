# Color System

> **Status:** 🟡 Seed · **Owner:** Senior UI/UX Designer · **Related:** [design-system](./design-system.md) · [dark-mode](./dark-mode.md)

## Purpose
Semantic, accessible color tokens that work in light and dark mode.

## Principles
- **Semantic tokens, not raw colors.** Components reference roles, never hex values.
- Define a palette (brand + neutrals + status scales), then map to semantic roles per theme.
- All text/background pairs meet WCAG AA contrast. Never use color as the only signal.

## Semantic roles (token names — values defined in Phase 4)
| Role | Usage |
|------|-------|
| `background` / `foreground` | Page base + default text |
| `card`, `popover` (+ `-foreground`) | Surfaces |
| `primary` (+ `-foreground`) | Primary actions/brand |
| `secondary`, `muted`, `accent` | Supporting surfaces/text |
| `border`, `input`, `ring` | Lines, fields, focus ring |
| `success`, `warning`, `destructive`, `info` (+ `-foreground`) | Status |

## Inventory status colors
Map stock/order states to status tokens consistently (e.g., in-stock=success, low=warning,
out=destructive, in-transit/reserved=info). Used by `StatusBadge` and charts.

## Rules
- Light/dark are two token mappings of the same roles. See [dark-mode](./dark-mode.md).
- Chart palettes derive from tokens; verify contrast and color-blind safety.
