# Typography

> **Status:** 🟡 Seed · **Owner:** Senior UI/UX Designer · **Related:** [design-system](./design-system.md) · [spacing](./spacing.md)

## Purpose
A clear, consistent type system for a data-dense enterprise UI.

## Principles
- A single modular **type scale** (tokens), used everywhere — no ad-hoc font sizes.
- Optimize for **density + legibility** (tables, forms, numbers).
- **Tabular/monospaced numerals** for quantities, money, and SKUs so columns align.

## Tokens (values finalized Phase 4)
- **Families:** UI sans (interface), mono (numbers/codes/SKUs).
- **Scale:** `display`, `h1`–`h4`, `body-lg`, `body`, `body-sm`, `caption`, `overline`.
- Each token defines size, line-height, weight, letter-spacing.

## Rules
- Headings follow a logical hierarchy (also for a11y); don't pick sizes for looks.
- Body text line length ~60–80ch; line-height ≥ 1.5 for paragraphs.
- Numbers in tables use tabular figures + right alignment.
- Respect user font-size/zoom; never disable zoom; use rem units.
