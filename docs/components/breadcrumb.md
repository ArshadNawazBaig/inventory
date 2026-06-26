# Breadcrumb — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Breadcrumb` + parts (`@stockflow/ui` → `primitives/breadcrumb`) |
| **Status** | ✅ Implemented — composable parts + tests + stories (Batch 4 · navigation) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [navbar.md](./navbar.md) · [dropdown.md](./dropdown.md) · Radix Slot · `@stockflow/icons` |

> **Architecture decision:** a **composable** location trail — plain semantic elements (`<nav>` →
> `<ol>` → `<li>`) skinned with tokens. **No Radix** except `Slot` (so links can be framework `<Link>`s);
> **server-renderable**. Separators are decorative; collapsed crumbs compose with `DropdownMenu` to stay
> reachable.

---

## 1. Overview

Shows where the current page sits in the app hierarchy and lets users jump to any ancestor. The trail is
a navigation landmark of links, ending in the (non-link) current page. Pairs with [Navbar](./navbar.md)
in page headers.

---

## 2. Parts

```ts
Breadcrumb          // <nav aria-label="Breadcrumb"> (navigation landmark)
BreadcrumbList      // <ol> — flex-wrap row of crumbs + separators
BreadcrumbItem      // <li>
BreadcrumbLink      // <a>; asChild → framework <Link>
BreadcrumbPage      // <span aria-current="page"> — the current page (non-interactive)
BreadcrumbSeparator // <li role="presentation" aria-hidden> — chevron by default; children override
BreadcrumbEllipsis  // decorative collapsed-crumbs marker; wrap in a DropdownMenu
```

Composition: `Breadcrumb > BreadcrumbList > (BreadcrumbItem · BreadcrumbSeparator)*`.

---

## 3. Behavior

- **Current page** is the last crumb, rendered with `BreadcrumbPage` (a `<span>`, not a link).
- **Separators** are decorative and hidden from assistive tech; the default is a chevron, overridable
  by passing children (e.g. `/`).
- **Collapsing:** for deep trails, replace the middle with `BreadcrumbEllipsis`; wrap it in a
  `DropdownMenu` to keep the hidden ancestors reachable.

---

## 4. Accessibility (acceptance criteria)

- Root is a `<nav>` labelled "Breadcrumb" → navigation landmark (override via `aria-label`).
- List uses real `<ol>`/`<li>` semantics; the current page carries `aria-current="page"` and is **not**
  a link.
- Separators are `aria-hidden` / `role="presentation"` (not announced); the only exposed links are the
  ancestor crumbs.
- Focus-visible rings on links; AA contrast for link, hover, and current text in both themes.

---

## 5. Testing (plan)

- **Landmark:** renders a navigation landmark named "Breadcrumb".
- **Links:** ancestor crumbs are links with hrefs; `asChild` renders a framework link.
- **Current:** the last crumb has `aria-current="page"` and is not a link.
- **Separators:** decorative (only the real crumbs are exposed as links); custom separator renders.
- **Ellipsis:** renders an `aria-hidden` marker.
- **A11y:** `axe` passes.

---

## 6. Documentation (deliverables)

- **Storybook:** default · collapsed (ellipsis) · custom separator; light + dark.
- **MDX do/don't:** last crumb is the current page (not a link); real links for ancestors; keep it
  shallow (hierarchy, not history); expose collapsed crumbs via a dropdown.

---

## 7. Definition of Done

Typed (no `any`) · composable parts · `asChild` links · custom separators · ellipsis/collapse pattern ·
accessible (nav landmark, ol/li, `aria-current`, hidden separators, axe) · Storybook · unit + a11y
tests · token-only styling. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
