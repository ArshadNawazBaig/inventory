# Spacing & Layout

> **Status:** 🟡 Seed · **Owner:** Senior UI/UX Designer · **Related:** [design-system](./design-system.md)

## Purpose
A consistent spatial system for rhythm and alignment.

## Principles
- **4px base unit**; spacing scale in multiples (4, 8, 12, 16, 24, 32, 48, 64…) as tokens.
- Use scale tokens only — no arbitrary pixel values.
- Consistent component padding and stack/gap spacing across the app.

## Layout
- **Breakpoints:** mobile-first; `sm` `md` `lg` `xl` `2xl` (values in Phase 4).
- **Grid/containers:** standardized max-widths and gutters for page content.
- App shell: fixed sidebar + top navbar + scrollable content region.
- Density modes for data tables (comfortable/compact) driven by spacing tokens.

## Rules
- Radius and shadow are tokens too (`radius-sm/md/lg`, `shadow-sm/md/lg`).
- Z-index uses named layers (base, dropdown, sticky, overlay, modal, toast) — no magic z-values.
- Responsive by default; verify at all breakpoints. See [frontend/accessibility](../frontend/accessibility.md).
