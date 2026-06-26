# Tabs — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Tabs` + parts (`@stockflow/ui` → `primitives/tabs`) |
| **Status** | ✅ Implemented — Radix-backed parts + variants + tests + stories (Batch 4 · navigation) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · `@radix-ui/react-tabs` · `@stockflow/icons` |

> **Architecture decision:** Radix Tabs (roving tabindex, arrow-key navigation, correct ARIA, automatic
> ↔ manual activation) skinned with tokens. A `variant` on `TabsList` (`line` | `pill`) is shared with
> its triggers via a small context (Radix doesn't propagate props down). `line` uses a **primary**
> underline indicator; `pill` is a segmented control on a muted track. Tokens only.

---

## 1. Overview

Switch between peer panels of the same context (e.g. a product's Overview / Stock / History) without
leaving the page. Inactive panels unmount by default. Two styles: an underlined rail for page-level
sections and a pill segmented control for compact, in-card switches.

---

## 2. Parts

```ts
Tabs         // Radix Root: value / defaultValue / onValueChange; activationMode 'automatic'|'manual'
TabsList     // role="tablist"; variant?: 'line' | 'pill' (inherited by triggers)
TabsTrigger  // role="tab"; value; disabled?; variant? (override, rarely needed)
TabsContent  // role="tabpanel"; value (matches a trigger)
```

Composition: `Tabs > TabsList > TabsTrigger* ; Tabs > TabsContent*`.

---

## 3. Behavior

- **Selection** is owned by `Tabs` — controlled (`value`/`onValueChange`) or uncontrolled
  (`defaultValue`).
- **Keyboard:** roving focus; arrow keys move between tabs. `activationMode="automatic"` (default)
  switches on focus; `"manual"` requires Enter/Space (use when a panel is expensive to render/fetch).
- **Active styling** is keyed off Radix's `data-state="active"`: `line` grows a primary underline;
  `pill` raises onto a `background` surface.
- Disabled triggers are skipped by keyboard and not selectable.

---

## 4. Accessibility (acceptance criteria)

- Radix wires `tablist` / `tab` / `tabpanel` roles, `aria-selected`, and `aria-controls`/`aria-labelledby`.
- **Label the `TabsList`** (`aria-label`/`aria-labelledby`) — it has no implicit name.
- Active tab is conveyed via `aria-selected` (+ styling), not colour alone; focus-visible rings on
  triggers and the panel; AA contrast in both themes.

---

## 5. Testing (plan)

- **Structure:** labelled tablist with the right number of tabs.
- **Panels:** default panel visible, others unmounted; clicking a tab swaps the panel + `aria-selected`.
- **Keyboard:** arrow key moves selection (automatic activation).
- **Variant:** triggers reflect the inherited list variant.
- **A11y:** `axe` passes.

---

## 6. Documentation (deliverables)

- **Storybook:** line · pill · with icons · disabled tab; light + dark.
- **MDX do/don't:** label the list; tabs are for peer views (not steps → stepper, not pages → links);
  pick `line` vs `pill` by context; use manual activation for expensive panels.

---

## 7. Definition of Done

Typed (no `any`) · Radix-backed parts · line/pill variants (context-shared) · primary active · controlled
+ uncontrolled · accessible (roles, labelled list, `aria-selected`, keyboard, axe) · Storybook · unit +
a11y tests · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
