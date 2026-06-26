# Navbar — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Navbar` + parts (`@stockflow/ui` → `primitives/navbar`) |
| **Status** | ✅ Implemented — composable parts + tests + stories in `packages/ui` (Batch 4 · navigation) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [sidebar.md](./sidebar.md) · [button.md](./button.md) · Radix Slot |

> **Architecture decision:** an app-shell **top bar** composite — a `<header>` (banner landmark) holding a
> brand, an optional horizontal `<nav>`, a spacer, and a right-aligned actions group. Plain semantic
> elements + tokens; **no Radix, no client state** (server-renderable). `asChild` makes the brand/links
> real anchors.

---

## 1. Overview

The horizontal bar across the top of the app shell: brand/logo (+ optional sidebar trigger), primary
horizontal nav (on wider layouts), and right-side actions — search, notifications, user menu. Pairs with
[Sidebar](./sidebar.md) for the shell.

---

## 2. Parts

```ts
Navbar         // <header>; sticky?: boolean (default true)
NavbarBrand    // logo/title; asChild → link
NavbarNav      // <nav> (give it an aria-label); horizontal link group
NavbarLink     // asChild?, active? → data-active
NavbarSpacer   // flex-1; pushes following content to the right
NavbarActions  // right-aligned group (search, icons, avatar/menu)
```

Composition: `Navbar > NavbarBrand · NavbarNav · NavbarSpacer · NavbarActions`.

---

## 3. Behavior

- **Sticky** by default (`sticky top-0 z-30`, below overlays at `z-50`).
- **Active link** via `active` (→ `data-active`); render real links with `asChild` (Next `<Link>`/`<a>`)
  and set `aria-current="page"` on the active route.
- Right-side density: place a sidebar `SidebarTrigger`, search `Input`, icon `Button`s, notification
  `Badge`, and a user `DropdownMenu` inside `NavbarActions`.

---

## 4. Accessibility (acceptance criteria)

- `Navbar` is a `<header>` → **banner** landmark (when top-level). `NavbarNav` is a `<nav>` → label it
  (`aria-label="Primary"`); icon-only actions need `aria-label`.
- Active link uses `aria-current="page"` + styling, not color alone.
- Focus-visible rings; AA contrast for links, hover, and active in both themes.
- Avoid duplicate landmarks — one banner per page; the spacer is `aria-hidden`.

---

## 5. Testing (plan)

- **Landmarks:** renders a banner; `NavbarNav` is a labelled navigation.
- **Active:** `active` sets `data-active`.
- **asChild:** brand/links render as anchors.
- **A11y:** `axe` passes for a composed navbar.

---

## 6. Documentation (deliverables)

- **Storybook:** brand + nav + actions (search, notifications, avatar menu); sticky; light + dark.
- **MDX do/don't:** one banner per page; label the nav; real links + `aria-current`; group right-side
  actions in `NavbarActions`.

---

## 7. Definition of Done

Typed (no `any`) · composable parts · sticky · active + `asChild` · accessible (banner/nav landmarks,
axe) · Storybook · unit + a11y tests · MDX docs · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
