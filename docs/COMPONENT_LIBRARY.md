# Component Library

| Field | Value |
|-------|-------|
| **Document** | Component Library (`packages/ui`) Specification |
| **Status** | ⚪ Not started — pending Design System approval |
| **Phase** | 4 — Component Design |
| **Depends on** | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) |
| **Owner** | Frontend Lead / UI Engineer |

> This document is reserved. Every component is documented before it is built. All UI is
> consumed from `packages/ui` — never built directly in pages. The outline below defines its scope.

## Planned contents

- Library principles: reusable, fully typed, accessible, responsive, dark-mode ready,
  variant-driven, themeable, Storybook-ready
- Component API conventions (props, variants, composition over inheritance, polymorphism)
- Per-component spec template: anatomy, props, variants, states, a11y, examples
- Inventory of components to deliver:
  - **Primitives:** Button, Input, Textarea, Checkbox, Switch, Select, Autocomplete,
    Radio, Slider, Label
  - **Overlays:** Modal, Drawer, Dialog, Dropdown, Tooltip, Popover, Toast, Command Palette
  - **Data:** Table, Data Grid, Pagination, Card, Badge, Avatar, Stats Card, Charts
  - **Navigation:** Sidebar, Navbar, Breadcrumb, Tabs, Accordion
  - **Forms & input:** Date Picker, Search Bar, Filters, File Upload
  - **Feedback:** Loading Skeleton, Empty States, Error States
  - **Domain:** Permission Wrapper, Role Badge, Status Badge
- Testing & Storybook coverage requirements per component
