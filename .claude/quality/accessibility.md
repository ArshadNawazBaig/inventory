# Accessibility (quality gate)

> **Status:** 🟡 Seed · **Owner:** QA / UX · **Related:** [frontend/accessibility](../frontend/accessibility.md) · [ui/design-system](../ui/design-system.md)

## Purpose
Accessibility is a release gate, not a nice-to-have. Baseline: **WCAG 2.1 AA**.

## What's verified
- Keyboard operability (full flows without a mouse), visible focus, no traps, Esc closes overlays.
- Semantics: landmarks, headings, labels; correct roles via Radix primitives.
- Contrast AA in light **and** dark mode; meaning never conveyed by color alone.
- Forms: labels, descriptive errors, `aria-invalid`/`aria-describedby`.
- Live regions announce async results; reduced-motion respected.

## How it's tested
- **Automated:** `axe`/`jsx-a11y` in component tests + CI; fails the build on violations.
- **Manual:** keyboard-only pass and screen-reader spot-checks for new/changed UI.
- Part of the PR checklist and component Definition of Done. See [checklists/pull-request](../checklists/pull-request.md).

## Ownership
- Design system bakes in accessible defaults (see [ui/component-rules](../ui/component-rules.md));
  features must not regress them with overrides.
