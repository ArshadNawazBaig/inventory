# Sidebar — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Sidebar` + parts (`@stockflow/ui` → `primitives/sidebar`) |
| **Status** | ✅ Implemented — composable parts + tests + stories in `packages/ui` (Batch 4 · navigation) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [card.md](./card.md) · [tooltip.md](./tooltip.md) · [button.md](./button.md) |

> **Architecture decision:** an **app-shell layout composite**, not a Radix primitive. A
> `SidebarProvider` holds collapse state (context, controllable + persistable); the parts are plain
> semantic elements styled with existing tokens (`bg-card`/`accent`/`border`) — **no new token set**.
> Collapsing is **CSS-driven** via a `data-state` on the root (`group-data-[state=collapsed]`), so labels
> hide without per-child JS. Mobile off-canvas is deferred to a future `Sheet`.

---

## 1. Overview

The primary left navigation for the authenticated app shell: brand/header, grouped nav items (with
icons + active state), and a footer (user/account). Collapses between a full panel and an **icon rail**.

---

## 2. Parts

```ts
SidebarProvider   // context: collapsed state + toggle (controlled/uncontrolled)
Sidebar           // <aside>; side?: 'left'|'right'; collapsible?: 'icon'|'none'
SidebarHeader · SidebarContent (scroll) · SidebarFooter
SidebarGroup · SidebarGroupLabel          // label hides when collapsed
SidebarMenu (ul) · SidebarMenuItem (li)
SidebarMenuButton // asChild?, active?, icon?, tooltip? — the nav row
SidebarTrigger    // toggles collapse
useSidebar()      // { collapsed, toggle, setCollapsed }
```

---

## 3. Behavior

- **Collapse:** `SidebarTrigger` (or `useSidebar().toggle`) switches expanded (`w-64`) ↔ icon rail
  (`w-16`). State lives in `SidebarProvider` — controlled (`collapsed`/`onCollapsedChange`) or
  uncontrolled (`defaultCollapsed`). `collapsible="none"` pins it open.
- **Labels** hide in the rail via CSS; the visible label becomes **`sr-only`** (kept in the accessible
  name, not removed), and `SidebarMenuButton` shows a **Tooltip** (`tooltip` prop) on the right when
  collapsed.
- **Active item** via `active` (→ `data-active`); render the row as a real link with `asChild`
  (Next `<Link>`/`<a>`).

---

## 4. Accessibility (acceptance criteria)

- `Sidebar` is an `<aside>` (complementary landmark) — give it an `aria-label`; nav rows are links/buttons
  with accessible names that **persist when collapsed** (label is `sr-only`, not `display:none`).
- `SidebarTrigger` has a name ("Toggle sidebar"); the collapse state is reflected on the root.
- Active state is conveyed by `aria-current` (consumer sets it on the link) + styling, not color alone.
- Focus-visible rings; AA contrast for items, active, and hover in both themes.

---

## 5. Testing (plan)

- **Render:** header/content/footer + grouped nav rows render with labels.
- **Collapse:** `SidebarTrigger` toggles the root `data-state`.
- **Active:** `active` sets `data-active`.
- **asChild:** renders nav rows as links.
- **A11y:** `axe` passes for a labelled sidebar.

---

## 6. Documentation (deliverables)

- **Storybook:** full shell (header + groups + footer); expanded vs icon rail; active item; right side;
  light + dark. Autodocs.
- **MDX do/don't:** one sidebar per shell; real links + `aria-current`; keep labels in the accessible name
  when collapsed; mobile off-canvas comes from `Sheet`.

---

## 7. Definition of Done

Typed (no `any`) · provider + parts · expanded/icon collapse (controlled+uncontrolled) · active +
`asChild` · tooltip-on-collapse · accessible (landmark, names persist collapsed, axe) · Storybook ·
unit + a11y tests · MDX docs · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
