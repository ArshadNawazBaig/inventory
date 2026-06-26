# Component Rules

> **Status:** 🟡 Seed · **Owner:** Frontend Lead · **Related:** [components](./components.md) · [design-system](./design-system.md)

## Purpose
The non-negotiable rules for building and consuming UI components.

## The cardinal rule
**All UI comes from `@stockflow/ui`.** Never build buttons, inputs, modals, tables, etc.
directly in pages or features. If a needed component doesn't exist, add it to the library
(documented + Storybook), then consume it.

## Authoring rules
- Built on Radix primitives; accessible by default (keyboard, focus, ARIA).
- **Fully typed** props; no `any`; sensible discriminated-union variants.
- Style only via **design tokens** (Tailwind v4 theme) — no hardcoded colors/sizes/spacing.
- Variant-driven (e.g., `variant`, `size`, `tone`) using a consistent variant utility.
- Controlled + uncontrolled supported where it makes sense; forward refs; spread valid DOM props.
- Responsive and dark-mode ready; respects reduced motion.
- Ships with a Storybook story covering variants/states and an accessibility check.

## Consuming rules
- Compose library components; don't fork or re-style with one-off CSS overrides.
- Permission-sensitive actions wrap in `PermissionWrapper`.
- Keep feature components thin — layout + data wiring, not new primitives.

## Definition of Done (component)
Typed · accessible · responsive · themed (light/dark) · variants · Storybook story · tests · docs.
