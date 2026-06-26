# Component Library (`packages/ui`)

| Field | Value |
|-------|-------|
| **Document** | Component Library (`@stockflow/ui`) — architecture & structure |
| **Status** | 🟡 Awaiting approval |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-26 |
| **Phase** | 4 — Component Design |
| **Depends on** | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [ICON_SYSTEM.md](./ICON_SYSTEM.md) · [ANIMATION_GUIDELINES.md](./ANIMATION_GUIDELINES.md) |

> **The cardinal rule:** all UI comes from `@stockflow/ui`. Apps/features never build primitives or
> inline raw markup for shared elements. This document defines the **library structure** — the
> actual components are built in a later step (none yet).

---

## 1. Principles

Every component will be: reusable · fully typed (no `any`) · accessible (Radix-based) · responsive ·
dark-mode ready · variant-driven (`cva`) · themeable (semantic tokens only) · Storybook-documented ·
tested. Composition over inheritance; one canonical component per problem.

---

## 2. Folder structure

```
packages/ui/
├── src/
│   ├── primitives/     # Atoms — smallest building blocks (Button, Input, Badge…)
│   ├── components/     # Composites built FROM primitives (DataTable, CommandPalette…)
│   ├── hooks/          # UI behavior hooks (useDisclosure, useControllableState…)
│   ├── lib/            # Pure utilities (cn, motion tokens, variant helpers)
│   ├── styles/         # Tailwind v4 theme/tokens (globals.css) + keyframes
│   ├── types/          # Shared prop types (Size, Tone, polymorphism helpers)
│   └── index.ts        # Public API barrel — the ONLY entry apps import
├── .storybook/         # Storybook config (docs + a11y) — component phase
├── components.json     # shadcn/ui CLI config (generation targets, aliases, tokens)
├── package.json        # name @stockflow/ui, exports map (root + ./styles.css)
└── tsconfig.json       # extends @stockflow/tsconfig/react-library.json
```

### Why each folder exists

| Folder | Purpose | Why separate |
|--------|---------|-------------|
| **`primitives/`** | Irreducible atoms (Button, Input, Checkbox, Switch, Select, Badge, Avatar, Label…). | Keeps base elements tiny/testable and enforces one-way dependencies. No domain logic. |
| **`components/`** | Composites assembled from primitives (Data Table, Command Palette, File Upload, Date Picker, Sidebar, Tabs, Charts…). Also the few generic domain-aware ones: `PermissionWrapper`, `RoleBadge`, `StatusBadge`. | Real UIs need composed pieces, but they must live in the library (not pages). May use primitives; never the reverse. |
| **`hooks/`** | UI behavior shared across components (`useDisclosure`, `useControllableState`, `useMediaQuery`, `useFocusTrap`). | Behavior in one tested place; keeps components small. (App-wide non-UI hooks live in `@stockflow/hooks`.) |
| **`lib/`** | Pure, stateless utilities: `cn` (class merge), `motion` (tokens), future `cva`/focus helpers. No React/JSX. | Lowest layer; trivially unit-testable; safe to import anywhere. |
| **`styles/`** | Tailwind v4 CSS-first theme: token ramps, semantic light/dark vars, `@theme inline` mapping, base layer. Exposed as `@stockflow/ui/styles.css`. | Single source of visual truth; apps import one stylesheet for theme + dark mode. |
| **`types/`** | Shared UI prop types/unions and polymorphism helpers (`Size`, `Tone`, `asChild`). | Consistent component API (`sm` means the same everywhere); pure types only. Distinct from `@stockflow/types` (domain/API). |
| **`index.ts`** | Public API barrel re-exporting primitives, components, hooks, lib, types. | The single import surface (`@stockflow/ui`); internals stay private. |
| **`.storybook/`** | Storybook config (`main.ts`, `preview.tsx`) — docs, theme toggle, a11y addon. | Living catalog; isolated dev + accessibility testing. Added when Storybook is installed. |
| **`components.json`** | shadcn/ui CLI config — generation targets, aliases, base color, css-variables, icon library. | Lets us scaffold primitives from shadcn (as a starting point) into our structure. |

### Dependency direction (one-way, enforced)
```
components/ → primitives/ → lib/ + styles/ + types/
hooks/ → lib/ + types/
```
No cycles; `lib`/`styles`/`types` are the lowest layers. Apps import only `@stockflow/ui` (root).

---

## 3. Per-component convention

Each component is a self-contained folder (atomic, colocated):
```
primitives/button/
  button.tsx          # implementation ("use client" only if interactive)
  button.variants.ts  # cva variants — the style API
  button.stories.tsx  # Storybook story (variants/states)
  button.test.tsx     # unit + a11y test
  index.ts            # public re-export
```
- `primitives/index.ts` and `components/index.ts` re-export their folders; `src/index.ts` re-exports
  both (plus `hooks`, `lib`, `types`).
- Styling uses **semantic tokens + Tailwind utilities** only (`bg-primary`, `text-muted-foreground`,
  `rounded-md`); variants via `cva`. No raw hex/px.

---

## 4. Component API conventions

- Fully typed props; discriminated-union variants; forward refs; spread valid DOM props.
- Controlled + uncontrolled where sensible (`useControllableState`).
- `asChild` (Radix `Slot`) for polymorphism instead of inheritance.
- Icons typed as `LucideIcon` from `@stockflow/icons`; motion uses tokens from `lib/motion`.
- Accessibility is part of the API (labels, `aria-*`, keyboard) — not an afterthought.

---

## 5. Component inventory (built later)

- **Primitives:** Button, Input, Textarea, Checkbox, Switch, Radio, Slider, Label, Select, Autocomplete, Badge, Avatar.
- **Overlays:** Modal, Drawer, Dialog, Dropdown, Tooltip, Popover, Toast, Command Palette.
- **Data:** Table, Data Grid, Pagination, Card, Stats Card, Charts.
- **Navigation:** Sidebar, Navbar, Breadcrumb, Tabs, Accordion.
- **Forms & input:** Date Picker, Search Bar, Filters, File Upload.
- **Feedback:** Loading Skeleton, Empty State, Error State.
- **Domain:** Permission Wrapper, Role Badge, Status Badge.

---

## 6. Definition of Done (per component)
Typed · accessible (keyboard + a11y test) · responsive · themed (light/dark) · variants ·
Storybook story · unit test · documented. Enforced in review.

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |

> On approval, components are built per [ROADMAP.md](./ROADMAP.md) P2 — primitives first, then composites.
