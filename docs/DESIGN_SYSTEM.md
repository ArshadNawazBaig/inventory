# Design System

| Field | Value |
|-------|-------|
| **Document** | Design System & Foundations (tokens) |
| **Status** | 🟡 Awaiting approval |
| **Owner** | Senior UI/UX Designer |
| **Date** | 2026-06-26 |
| **Phase** | 4 — Component Design (foundations) |
| **Scope** | **Tokens & foundations only — no UI components.** |
| **Implementation** | [`packages/ui/src/styles/globals.css`](../packages/ui/src/styles/globals.css) (Tailwind v4 `@theme`) |
| **Related** | [.claude/ui/](../.claude/ui/) · [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) |

> **Token-driven, theme-aware, accessible by default.** Every visual value is a design token.
> Components (next phase) consume **semantic** tokens only — never raw hex, px, or scale values.
> Two-layer model: **primitive tokens** (raw scales) → **semantic tokens** (roles that flip per
> theme). Light and dark are two mappings of the *same* semantic roles.

---

## 1. Foundations of the system

| Layer | Example | Who uses it |
|-------|---------|-------------|
| **Primitive** | `--color-brand-600`, `--text-h2`, `--shadow-md` | The system itself; rarely components |
| **Semantic** | `--color-primary`, `--color-background`, `--color-border` | Components, always |

- **Tailwind v4 CSS-first**: tokens live in `@theme` / CSS variables; utilities are generated
  from them (`bg-primary`, `text-muted-foreground`, `rounded-md`, `shadow-lg`).
- **Theming** via a `.dark` class on `<html>` that swaps semantic variable values.
- Components reference roles, so they work in both themes with zero per-component branching.

---

## 2. Color Palette

### 2.1 Primitive ramps
Brand = **Indigo**. Neutrals = **Slate**. Plus status ramps. (Full 50–950 ramps in the CSS.)

| Ramp | 50 | 500 | 600 | 700 | 900 |
|------|----|-----|-----|-----|-----|
| **Brand (indigo)** | `#eef2ff` | `#6366f1` | `#4f46e5` | `#4338ca` | `#312e81` |
| **Neutral (slate)** | `#f8fafc` | `#64748b` | `#475569` | `#334155` | `#0f172a` |
| **Success (emerald)** | `#ecfdf5` | `#10b981` | `#059669` | `#047857` | `#064e3b` |
| **Warning (amber)** | `#fffbeb` | `#f59e0b` | `#d97706` | `#b45309` | `#78350f` |
| **Destructive (red)** | `#fef2f2` | `#ef4444` | `#dc2626` | `#b91c1c` | `#7f1d1d` |
| **Info (blue)** | `#eff6ff` | `#3b82f6` | `#2563eb` | `#1d4ed8` | `#1e3a8a` |

### 2.2 Semantic roles (the only colors components use)
| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `background` / `foreground` | `#ffffff` / `#0f172a` | `#020617` / `#f8fafc` | Page base + default text |
| `card` (+ `-foreground`) | `#ffffff` / `#0f172a` | `#0f172a` / `#f8fafc` | Raised surfaces |
| `popover` (+ `-foreground`) | `#ffffff` / `#0f172a` | `#0f172a` / `#f8fafc` | Floating surfaces |
| `primary` (+ `-foreground`) | `#4f46e5` / `#ffffff` | `#6366f1` / `#ffffff` | Primary actions/brand |
| `secondary` (+ `-foreground`) | `#f1f5f9` / `#0f172a` | `#1e293b` / `#f8fafc` | Secondary surfaces |
| `muted` (+ `-foreground`) | `#f1f5f9` / `#64748b` | `#1e293b` / `#94a3b8` | Subtle bg + secondary text |
| `accent` (+ `-foreground`) | `#f1f5f9` / `#0f172a` | `#1e293b` / `#f8fafc` | Hover/active surfaces |
| `border` | `#e2e8f0` | `#1e293b` | Hairlines, dividers |
| `input` | `#e2e8f0` | `#334155` | Field borders |
| `ring` | `#6366f1` | `#6366f1` | Focus ring |
| `success` / `warning` / `destructive` / `info` (+ `-foreground`) | `#059669` / `#d97706` / `#dc2626` / `#2563eb` | `#10b981` / `#f59e0b` / `#ef4444` / `#3b82f6` | Status |

### 2.3 Inventory status colors (semantic, domain-specific)
Mapped to status roles so `StatusBadge` and charts stay consistent. **Never color-only** — always paired with a label/icon.

| State | Token | Maps to |
|-------|-------|---------|
| In stock | `--color-status-in-stock` | success |
| Low stock | `--color-status-low-stock` | warning |
| Out of stock | `--color-status-out-of-stock` | destructive |
| Reserved | `--color-status-reserved` | info |
| In transit | `--color-status-in-transit` | brand |
| Damaged / quarantine | `--color-status-damaged` | destructive (muted) |

---

## 3. Typography

- **Sans** (UI): `Inter`, with a system-ui fallback stack → `--font-sans`.
- **Mono** (SKUs, quantities, money, code): `JetBrains Mono` + system mono → `--font-mono`.
- **Tabular numerals** (`font-variant-numeric: tabular-nums`) for all numeric table columns so
  digits align.

### Type scale
| Token | Size / Line-height | Weight | Use |
|-------|--------------------|--------|-----|
| `display` | 3rem / 1.1 | 700 | Marketing/hero |
| `h1` | 2.25rem / 1.2 | 700 | Page title |
| `h2` | 1.875rem / 1.25 | 600 | Section |
| `h3` | 1.5rem / 1.3 | 600 | Sub-section |
| `h4` | 1.25rem / 1.4 | 600 | Card title |
| `body-lg` | 1.125rem / 1.6 | 400 | Lead text |
| `body` | 1rem / 1.5 | 400 | Default |
| `body-sm` | 0.875rem / 1.5 | 400 | Dense UI, tables |
| `caption` | 0.75rem / 1.4 | 500 | Labels, meta |
| `overline` | 0.6875rem / 1.4 | 600 | Uppercase eyebrow (tracking-wide) |

**Weights:** 400 regular · 500 medium · 600 semibold · 700 bold. Headings follow a logical
hierarchy (also for a11y) — never pick a size purely for looks.

---

## 4. Spacing

- **Base unit: 4px** (`--spacing` = 0.25rem). All spacing is a multiple — no arbitrary px.

| Token | px | Common use |
|-------|----|-----------|
| `1` | 4 | icon gap |
| `2` | 8 | tight padding |
| `3` | 12 | control padding |
| `4` | 16 | default gap/padding |
| `6` | 24 | card padding, grid gutter |
| `8` | 32 | section gap |
| `12` | 48 | large section |
| `16` | 64 | page section |

Component padding and stack/gap spacing are standardized on this scale across the app.

---

## 5. Grid & Layout

- **12-column** fluid grid; default **gutter 24px** (`gap-6`).
- **Content max-width** ~1280px (`xl`) for reading/data density; full-bleed allowed for tables.
- **App shell:** fixed sidebar **256px** (collapsed **64px**) + top navbar **56px** + scrollable
  content region.
- **Density modes** for data tables (comfortable / compact) driven by spacing tokens.
- Mobile-first; layouts reflow at the breakpoints below.

---

## 6. Breakpoints

| Token | Min width | Target |
|-------|-----------|--------|
| `sm` | 640px | large phone |
| `md` | 768px | tablet |
| `lg` | 1024px | laptop (sidebar persistent ≥ lg) |
| `xl` | 1280px | desktop |
| `2xl` | 1536px | wide desktop |

---

## 7. Radius

| Token | Value | Use |
|-------|-------|-----|
| `sm` | 4px | badges, small inputs |
| `md` | 8px | buttons, inputs, default |
| `lg` | 12px | cards |
| `xl` | 16px | modals, large surfaces |
| `2xl` | 24px | feature panels |
| `full` | 9999px | pills, avatars |

Base `--radius` = 8px; component radii derive from it.

---

## 8. Elevation (shadows)

Light-mode shadow scale (subtle, neutral):

| Token | Use |
|-------|-----|
| `xs` | hairline lift (inputs) |
| `sm` | cards at rest |
| `md` | dropdowns, popovers |
| `lg` | modals, drawers |
| `xl` | command palette, dialogs |

**Dark mode:** shadows are de-emphasized; depth is conveyed by **lighter surfaces + borders**
(a card is lighter than the page), not heavy drop shadows.

---

## 9. Motion

Powered by **Framer Motion** (`motion/react`), token-driven, subtle, and fast.

| Token | Value |
|-------|-------|
| `--duration-fast` | 120ms (hovers, small state) |
| `--duration-base` | 180ms (default transitions) |
| `--duration-slow` | 240ms (overlays enter/exit) |
| `--duration-slower` | 320ms (large/page transitions) |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` (enter) |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` (exit) |

**Rules:** animate cheap properties (transform/opacity); motion communicates state/continuity,
never decoration; **always honor `prefers-reduced-motion`** (reduce/disable non-essential motion);
loading uses skeletons, not spinners, for content.

---

## 10. Z-index layers

Named layers — never magic z-values.

| Token | Value | Layer |
|-------|-------|-------|
| `--z-dropdown` | 1000 | dropdown menus |
| `--z-sticky` | 1100 | sticky headers |
| `--z-overlay` | 1200 | modal/drawer backdrop |
| `--z-modal` | 1300 | modal/drawer |
| `--z-popover` | 1400 | popovers |
| `--z-toast` | 1500 | toasts |
| `--z-tooltip` | 1600 | tooltips |

---

## 11. Accessibility (baseline: WCAG 2.1 AA)

- **Contrast:** text ≥ 4.5:1 (≥ 3:1 for large/UI), verified in **both** themes. All semantic
  pairs above meet AA.
- **Never color alone:** status conveyed by color **+ icon + label**.
- **Focus:** visible focus ring on every interactive element — `ring` color + 2px width + 2px
  offset; never remove outlines without a replacement.
- **Targets:** ≥ 44×44px on touch; ≥ 24px with adequate spacing in dense desktop tables.
- **Motion:** respect `prefers-reduced-motion`.
- **Type:** rem-based; respects user zoom/font scaling; body line-height ≥ 1.5.
- Built on Radix primitives (next phase) for keyboard + ARIA correctness by default.

---

## 12. Light & Dark Themes

- Two mappings of the **same** semantic roles (§2.2). Default to system preference; user override
  persisted; applied via `.dark` on `<html>` with **no flash** (set before hydration).
- Dark surfaces use tuned slate neutrals (not pure black); elevation via lighter surfaces + borders.
- Charts and status colors pull theme-aware tokens so they remain legible and AA-compliant in both.

---

## 13. How components will consume tokens (next phase)

- Only **semantic** tokens + Tailwind utilities generated from them (`bg-card`, `text-foreground`,
  `border-border`, `rounded-md`, `shadow-sm`, `text-muted-foreground`).
- No raw hex / px / scale values in component code (enforced in review).
- Variants (size/tone) compose tokens via `class-variance-authority`.

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Senior UI/UX Designer / CTO | ☐ Approved ☐ Changes requested | |

> On approval, the **Component Library** ([COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)) is built
> on these tokens (Phase 4 / roadmap P2).
