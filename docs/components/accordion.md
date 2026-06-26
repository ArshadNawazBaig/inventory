# Accordion — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Accordion` + parts (`@stockflow/ui` → `primitives/accordion`) |
| **Status** | ✅ Implemented — Radix-backed parts + tests + stories (Batch 4 · navigation) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · `@radix-ui/react-accordion` · `@stockflow/icons` (chevron) |

> **Architecture decision:** Radix Accordion (headings + buttons, `aria-expanded`/`aria-controls`,
> keyboard navigation, single/multiple modes) skinned with tokens. The open/close height transition uses
> two keyframes (`accordion-down`/`accordion-up`) registered in the design tokens (`globals.css`), driven
> by Radix's `--radix-accordion-content-height` and gated by the global reduced-motion rule. Tokens only.

---

## 1. Overview

Stacked, collapsible sections for progressive disclosure — FAQs, settings groups, detail panels on a
product page. Each section has a header button and a collapsible panel; the chevron rotates with state.

---

## 2. Parts

```ts
Accordion         // Radix Root: type 'single'|'multiple'; collapsible? (single); value/defaultValue/onValueChange
AccordionItem     // value; disabled?; bottom-border separator
AccordionTrigger  // header button (rendered inside an <h3>); rotating chevron
AccordionContent  // collapsible panel; height-animated
```

Composition: `Accordion > AccordionItem > (AccordionTrigger · AccordionContent)`.

---

## 3. Behavior

- **Modes:** `type="single"` opens one section at a time (add `collapsible` to allow all-closed);
  `type="multiple"` lets sections open independently.
- **State** is owned by `Accordion` — controlled (`value`/`onValueChange`) or uncontrolled
  (`defaultValue`).
- **Animation:** the panel height-animates open/closed via the `accordion-down`/`accordion-up`
  keyframes; the chevron rotates 180°. Both respect `prefers-reduced-motion` (global base rule).
- Disabled items can't be toggled and are skipped by the keyboard.

---

## 4. Accessibility (acceptance criteria)

- Radix renders each trigger as a `<button>` inside a heading, wiring `aria-expanded`,
  `aria-controls`, and the panel `region` + `aria-labelledby`.
- Keyboard: Up/Down move between triggers, Home/End jump to first/last, Enter/Space toggle.
- Open state is conveyed via `aria-expanded` (+ chevron), not colour alone; focus-visible rings on
  triggers; AA contrast in both themes.

---

## 5. Testing (plan)

- **Structure:** triggers are buttons (inside headings).
- **State:** default-open panel visible, others collapsed (`aria-expanded`); toggling closes a single
  collapsible item; opening another collapses the previous (single); `multiple` keeps several open.
- **A11y:** `axe` passes.

---

## 6. Documentation (deliverables)

- **Storybook:** single (collapsible) · multiple · disabled item; light + dark.
- **MDX do/don't:** pick single vs multiple by intent; not a replacement for tabs (peer views) or a
  stepper (multi-step flow); keep section labels short.

---

## 7. Definition of Done

Typed (no `any`) · Radix-backed parts · single/multiple + collapsible · height animation (reduced-motion
safe) · controlled + uncontrolled · accessible (headings, `aria-expanded`, keyboard, axe) · Storybook ·
unit + a11y tests · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
