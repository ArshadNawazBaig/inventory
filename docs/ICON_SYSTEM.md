# Icon System

| Field | Value |
|-------|-------|
| **Document** | Icon System |
| **Status** | 🟡 Awaiting approval |
| **Owner** | Senior UI/UX Designer |
| **Date** | 2026-06-26 |
| **Phase** | 4 — Component Design (foundations) |
| **Implementation** | [`packages/icons`](../packages/icons) |
| **Related** | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [.claude/ui/icons.md](../.claude/ui/icons.md) |

> **One library, one curated set, one import path.** All icons come from `@stockflow/icons`
> (which wraps the chosen library). Features never import the icon library directly and never inline
> raw SVGs. Icons inherit color via `currentColor` and are sized with tokens.

---

## 1. Recommended library: **Lucide** (`lucide-react`)

**Decision: Lucide.** It's already wired in `packages/icons`.

**Why Lucide**
- **Coverage:** 1,500+ icons on a consistent **24×24 grid, 2px stroke** — enough for an entire ERP-class app without one-offs.
- **Consistency:** single geometric outline style → a coherent UI (filled emphasis available where needed).
- **DX:** per-icon tree-shakable imports, first-class **React 19** components, `LucideIcon` type, props for `size`/`color`/`strokeWidth`, and **`currentColor` by default** (themeable for free).
- **Ecosystem fit:** the default icon set for **shadcn/ui** (our component approach), so docs/examples align.
- **License:** ISC/MIT — free for commercial use.

**Alternatives considered**
| Library | Why not (for us) |
|---------|------------------|
| Radix Icons | Excellent but small (~300, 15px grid) — too limited for a full app. |
| Heroicons | Good, Tailwind-made, but smaller set and only two weights. |
| Phosphor | Large + multiple weights, but heavier and stylistically busier than we need. |
| Tabler Icons | Comparable to Lucide; Lucide wins on shadcn alignment + ecosystem familiarity. |
| Font/CDN icon sets | Rejected — no tree-shaking, weaker a11y/typing, harder theming. |

**The wrapper package matters more than the library.** Because everything imports from
`@stockflow/icons`, switching libraries later is a single-package change, not an app-wide refactor.

---

## 2. Architecture

```
@stockflow/icons
├── src/index.ts      # curated generic UI icons + LucideIcon type + re-export aliases
└── src/aliases.ts    # semantic/domain aliases (ProductIcon, DeleteIcon, SuccessIcon, …)
```
- The package **curates** (re-exports only what we use) and adds **semantic aliases**.
- Apps import named components: `import { ProductIcon, EditIcon } from '@stockflow/icons'`.

---

## 3. Naming conventions

- **Component names:** `PascalCase`.
- **Generic UI icons** keep the library name where there's no domain meaning: `ChevronDown`,
  `Check`, `X`, `Search`, `Loader2`.
- **Semantic/domain aliases** use the suffix **`Icon`** and describe the *concept*, not the glyph:
  `ProductIcon`, `WarehouseIcon`, `TransferIcon`, `PurchaseOrderIcon` — so the underlying glyph can
  change globally without touching call sites.
- **Action icons** are named by action: `AddIcon`, `EditIcon`, `DeleteIcon`, `ExportIcon`,
  `ImportIcon`, `FilterIcon`, `MoreIcon`.
- **Status icons:** `SuccessIcon`, `WarningIcon`, `ErrorIcon`, `InfoIcon`.
- **One concept = one icon, everywhere** (e.g., delete is *always* `DeleteIcon`). Never use two
  different glyphs for the same action across the app.
- Files in the package: `kebab-case`. No abbreviations in names.

### Canonical mapping (implemented in `aliases.ts`)
| Alias | Glyph | Alias | Glyph |
|-------|-------|-------|-------|
| `DashboardIcon` | LayoutDashboard | `AddIcon` | Plus |
| `ProductIcon` | Package | `EditIcon` | Pencil |
| `ProductsIcon` | Boxes | `DeleteIcon` | Trash2 |
| `VariantIcon` | Box | `ExportIcon` | Download |
| `CategoryIcon` | FolderTree | `ImportIcon` | Upload |
| `BrandIcon` | Tag | `FilterIcon` | Filter |
| `UnitIcon` | Ruler | `SearchIcon` | Search |
| `WarehouseIcon` | Warehouse | `MoreIcon` | Ellipsis |
| `LocationIcon` | MapPin | `SuccessIcon` | CircleCheck |
| `TransferIcon` | ArrowLeftRight | `WarningIcon` | TriangleAlert |
| `AdjustmentIcon` | SlidersHorizontal | `ErrorIcon` | CircleX |
| `CountIcon` | ClipboardList | `InfoIcon` | Info |
| `ReorderIcon` | RotateCw | `SupplierIcon` | Building2 |
| `PurchaseOrderIcon` | ShoppingCart | `SalesOrderIcon` | ShoppingBag |
| `ShipmentIcon` | Truck | `MembersIcon` | Users |
| `NotificationIcon` | Bell | `SettingsIcon` | Settings |

---

## 4. Usage rules

- ✅ Import **only** from `@stockflow/icons`. ❌ Never `import … from 'lucide-react'` in apps/features.
- ❌ **No inline/raw SVGs** in features — add to the package instead.
- ✅ Prefer **semantic aliases** (`ProductIcon`) over raw glyphs (`Package`) when a domain concept exists.
- ✅ Pair action icons with a **text label**; icon-only controls require an `aria-label` **and** a tooltip.
- ✅ Keep a **single, consistent stroke width** (library default 2px); don't mix weights.
- ❌ Don't decorate UI with icons that add no meaning; every icon earns its place.
- ❌ Don't transform/scale icons arbitrarily — use the size tokens (§5).
- **Adding an icon** = add it to the package catalog (and a semantic alias if it's a domain concept)
  in a reviewed change; never bypass the package.

---

## 5. Sizing

Icons are sized with Tailwind `size-*` utilities (sets width+height; overrides the SVG's default
24px). Sizes align to the 4px grid and to type sizes.

| Token | Size | Tailwind | Use |
|-------|------|----------|-----|
| `xs` | 14px | `size-3.5` | dense inline / table cells |
| `sm` | 16px | `size-4` | **default** inline w/ body-sm, buttons, menu items |
| `md` | 20px | `size-5` | inputs, nav items, primary buttons |
| `lg` | 24px | `size-6` | section headers |
| `xl` | 32px | `size-8` | small empty states |
| `2xl` | 48px | `size-12` | large empty states / illustrative |

- **Default = 16–20px**; match icon size to adjacent text (~1em) and center with `inline-flex
  items-center gap-2`.
- For very large icons (≥ 32px), a slightly thinner stroke (1.5) is acceptable for optical balance.

---

## 6. Colors

- Icons inherit **`currentColor`** — set color with **text color utilities**, never hardcoded hex.
- Use **semantic tokens** from the design system: `text-foreground`, `text-muted-foreground`,
  `text-primary`, and status tokens `text-success` / `text-warning` / `text-destructive` / `text-info`.
- **Decorative** icons inherit the surrounding text color; **interactive** icons may use
  `text-muted-foreground` with a `hover:text-foreground` (or `text-primary`) state.
- **Dark mode is automatic** (currentColor + semantic tokens flip with the theme).
- **Never convey meaning by color alone** — pair status color with shape/label (a11y, §7).
- Meaningful icons must meet **≥ 3:1** non-text contrast against their background.

---

## 7. Accessibility

- **Decorative icons** (next to a visible label): mark `aria-hidden` so screen readers skip them.
- **Meaningful standalone icons** (icon-only button/link): give an **accessible name** —
  `aria-label` on the control (preferred), or `aria-label`/`role="img"` on the icon itself.
- **Icon-only controls**: `aria-label` **+ tooltip**, and a hit area ≥ **44×44px** on touch
  (≥ 24px with spacing on dense desktop).
- **Never rely on the icon alone** to convey required information or state — include text/label.
- **Animated icons** (e.g., `Loader2` spinner) must respect `prefers-reduced-motion`; provide a
  text status (e.g., "Loading…" via `aria-live`) rather than spin-only feedback.
- Keep icon semantics consistent so assistive-tech users learn them once.

---

## 8. How components will use icons (next phase)

- Buttons/inputs/menus accept an `icon`/`leadingIcon` prop typed as `LucideIcon` from
  `@stockflow/icons`.
- `StatusBadge` maps inventory states → `SuccessIcon`/`WarningIcon`/`ErrorIcon`/`InfoIcon` + label
  + status color token (never color-only).

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Senior UI/UX Designer / CTO | ☐ Approved ☐ Changes requested | |
