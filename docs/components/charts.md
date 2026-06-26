# Charts — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `ChartContainer` + helpers (`@stockflow/ui` → `primitives/chart`) |
| **Status** | ✅ Implemented — token bridge + tooltip/legend + tests + stories (Batch 5 · data) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · `recharts` · `@stockflow/icons` |

> **Architecture decision:** Recharts renders colours as **SVG props** (`fill`/`stroke`), not classes —
> so they can't be tokenised directly. `ChartContainer` solves this by injecting `--color-<key>` CSS
> variables from a `config`, mapped to a **theme-aware `--chart-1…5` palette** (defined in `globals.css`,
> flips light/dark). Series reference `var(--color-<key>)`, so every chart themes automatically. Axes,
> grid, and text are tokenised via container classes. Tooltip/legend bodies are token-styled React
> components. Consumers compose Recharts chart primitives directly inside `ChartContainer` (shadcn model).

---

## 1. Overview

A thin, token-driven layer over Recharts for line/area/bar/pie charts. You bring the Recharts chart
(`<LineChart>` etc.); `ChartContainer` supplies theming, responsive sizing, and an injected colour map;
`ChartTooltipContent`/`ChartLegendContent` give consistent, themed tooltips and legends.

---

## 2. API

```ts
ChartContainer        // config: ChartConfig; wraps a ResponsiveContainer; injects --color-<key>
ChartTooltip          // = Recharts Tooltip (use content={<ChartTooltipContent />})
ChartTooltipContent   // token-styled tooltip; hideLabel? hideIndicator? indicator: 'dot'|'line'
ChartLegend           // = Recharts Legend (use content={<ChartLegendContent />})
ChartLegendContent    // token-styled legend
useChart()            // { config } (empty outside a container)

type ChartConfig = Record<string, { label?: ReactNode; icon?: LucideIcon; color?: string }>
```

Palette tokens: `--chart-1 … --chart-5` (and `--color-chart-N`) — reference as `var(--chart-1)`.

---

## 3. Behavior

- **Colour bridge:** `config[key].color` (e.g. `var(--chart-1)`) becomes a `--color-<key>` variable on
  the container; series use `stroke`/`fill="var(--color-<key>)"`. Theme tokens flip light/dark for free.
- **Sizing:** wraps Recharts `ResponsiveContainer`; set an explicit height (`h-72`) or rely on the
  default `aspect-video`.
- **Tooltip/legend:** `ChartTooltipContent`/`ChartLegendContent` read labels and colours from the config
  (falling back to the Recharts payload); `useChart` is graceful outside a container.

---

## 4. Accessibility (acceptance criteria)

- Charts are visual — give `ChartContainer` an `aria-label` describing the insight; pair critical data
  with an accessible table/summary where decisions depend on it.
- Tooltip/legend text uses AA-contrast tokens in both themes; the colour palette is distinguishable, but
  colour is never the only carrier of meaning (labels accompany series).

---

## 5. Testing (plan)

- **Bridge:** `ChartContainer` injects `--color-<key>` variables from config and tags `[data-chart]`.
- **Tooltip:** renders label, series names, and values when active; nothing when inactive/empty;
  `hideLabel` hides the header.
- **Legend:** renders an entry per series.
- **A11y:** `axe` passes for tooltip content.

> Note: Recharts needs a measured size to draw, which jsdom lacks — so tests target the token bridge and
> the tooltip/legend components (rendered standalone), not the painted SVG.

---

## 6. Documentation (deliverables)

- **Storybook:** line · bar · area · pie; light + dark.
- **MDX do/don't:** colour from config (never hard-coded hex); set an explicit height; add an aria-label;
  reuse one key→colour mapping across related charts.

---

## 7. Definition of Done

Typed (no `any`) · token colour bridge (`--chart-N` palette) · tokenised axes/grid/text · themed
tooltip + legend · line/bar/area/pie via Recharts · accessible (aria-label guidance, AA contrast) ·
Storybook · unit + a11y tests · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
