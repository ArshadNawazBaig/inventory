# Icons

> **Status:** 🟡 Seed · **Owner:** Senior UI/UX Designer · **Related:** [design-system](./design-system.md) · [monorepo](../architecture/monorepo.md)

## Purpose
A single, consistent icon set delivered via `packages/icons`.

## Principles
- One icon library (consistent grid, stroke, style) wrapped in `@stockflow/icons`.
- Icons are components, sized via tokens, colored via `currentColor` (inherit theme).
- Pages import from `@stockflow/icons`, never raw SVGs scattered in features.

## Rules
- Standard sizes from the scale (e.g., 16/20/24); align to the spacing grid.
- **Accessibility:** decorative icons `aria-hidden`; meaningful icons get an accessible label.
- Never rely on an icon alone to convey state — pair with text/label (see status badges).
- Keep the set curated; adding an icon is a small, reviewed change (avoid one-off SVGs).

## Usage
- Action icons (edit/delete/export), status icons, navigation icons, and domain icons
  (warehouse, box, transfer, supplier) all live in the package with a documented inventory.
