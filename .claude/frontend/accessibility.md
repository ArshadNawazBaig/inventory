# Frontend Accessibility

> **Status:** 🟡 Seed · **Owner:** Frontend Lead / UX · **Related:** [ui/design-system](../ui/design-system.md) · [quality/accessibility](../quality/accessibility.md)

## Purpose
Make StockFlow usable by everyone — WCAG 2.1 AA is the baseline, not a stretch goal.

## Rules
- Build on **Radix UI** primitives (accessible by default) via the design system.
- **Keyboard:** every interactive element reachable and operable by keyboard; logical tab order;
  visible focus states; no keyboard traps; support Esc to close overlays.
- **Semantics:** correct landmarks/headings; native elements over ARIA where possible; labels on
  all controls; `aria-*` only to fill genuine gaps.
- **Contrast:** text ≥ 4.5:1 (≥ 3:1 large); never convey meaning by color alone.
- **Forms:** associated labels, descriptive errors, `aria-invalid`/`aria-describedby`.
- **Live regions:** announce async results (toasts, save status) politely.
- **Motion:** honor `prefers-reduced-motion`. See [ui/animations](../ui/animations.md).
- **Images:** meaningful `alt`; decorative images `alt=""`.

## Testing
- Automated: axe in component tests + CI. Manual: keyboard-only pass and screen-reader spot-checks.
- A11y is part of Definition of Done — see [checklists/pull-request](../checklists/pull-request.md).
