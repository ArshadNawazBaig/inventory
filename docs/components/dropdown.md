# Dropdown (Menu) — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `DropdownMenu` + parts (`@stockflow/ui` → `primitives/dropdown`) |
| **Status** | ✅ Implemented — composable parts + tests + stories in `packages/ui` (Batch 3 · overlays) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [select.md](./select.md) · [popover.md](./popover.md) · **Radix Dropdown Menu** |

> **Architecture decision:** built on **`@radix-ui/react-dropdown-menu`** — a true **menu** with
> `menu`/`menuitem(checkbox|radio)` roles, full keyboard support (arrows, typeahead, `Home`/`End`),
> submenus, and portalled positioning. It is **not** [Select](./select.md) (which is a form value) and
> not [Popover](./popover.md) (arbitrary content) — it is a list of **actions/options**.

---

## 1. Scope

Row "⋯" action menus, the user avatar menu, bulk-action menus, view options (checkbox/radio items).
For choosing a **form value** use Select; for **rich content** use Popover.

---

## 2. Parts

```ts
DropdownMenu · DropdownMenuTrigger · DropdownMenuContent
DropdownMenuItem (inset?, variant?: 'default' | 'destructive')
DropdownMenuCheckboxItem · DropdownMenuRadioGroup · DropdownMenuRadioItem
DropdownMenuLabel (inset?) · DropdownMenuSeparator · DropdownMenuGroup
DropdownMenuSub · DropdownMenuSubTrigger · DropdownMenuSubContent
DropdownMenuShortcut   // ⌘-hint, right-aligned
```

Items auto-size leading icons (`[&_svg]:size-4`); `inset` aligns text when some items have icons and
others don't; `variant="destructive"` tints dangerous actions.

---

## 3. Behavior

- **Open** via trigger (click / `Enter` / `Space` / `↓`); **navigate** with arrows + typeahead; **select**
  with `Enter`; **close** on select, `Esc`, or outside-click — focus returns to the trigger (Radix).
- **Checkbox / radio items** carry their own state (`checked` / `value` + `onValueChange`); selecting them
  can keep the menu open (`onSelect` `preventDefault`) for multi-toggle.
- **Submenus** open on hover/→ and are keyboard-navigable. Portalled + collision-aware.

---

## 4. Accessibility (acceptance criteria)

- Radix provides `role="menu"` + `menuitem`/`menuitemcheckbox`/`menuitemradio`, `aria-checked`, roving
  focus, and typeahead — keep them.
- The trigger needs an accessible name (icon-only "⋯" trigger → `aria-label`).
- Destructive items are distinguished by **text/label**, not color alone; separators/labels organize long
  menus.
- Focus-visible highlight (`focus:bg-accent`); AA contrast for items, shortcuts, and the highlight in both
  themes.

---

## 5. Testing (plan)

- **Open/close:** trigger opens (`role="menu"`); select/`Esc`/outside-click close.
- **Select:** `onSelect` fires; item closes the menu.
- **Checkbox item:** `onCheckedChange` fires; `role="menuitemcheckbox"` + `aria-checked`.
- **Disabled item:** not actionable (`data-disabled`).
- **A11y:** `axe` passes for the open menu (region rule scoped out — page-level).

---

## 6. Documentation (deliverables)

- **Storybook:** actions menu; with icons + shortcuts + separators + label; destructive item; checkbox/
  radio items; submenu; icon-only trigger; light + dark.
- **MDX do/don't:** Dropdown (actions) vs Select (value) vs Popover (content); name the trigger; group long
  menus; mark destructive actions clearly.

---

## 7. Definition of Done

Typed (no `any`) · full part set (items, checkbox/radio, label, separator, sub, shortcut) · inset +
destructive · keyboard + typeahead + submenus (Radix) · accessible (roles/aria, axe) · Storybook ·
unit + a11y tests · MDX docs · token-only styling (`bg-popover`/`accent`). (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
