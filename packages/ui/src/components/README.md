# `components/` — composite components

Higher-level components assembled **from `primitives/`** (molecules/organisms): Data Table,
Command Palette, File Upload, Date Picker, Pagination, Stats Card, Empty/Error states, Sidebar,
Navbar, Breadcrumb, Tabs, Accordion, Charts, etc.

**Why it exists:** real UIs need composed pieces, but they must not live in app pages (the cardinal
rule: all UI comes from `@stockflow/ui`). Separating composites from `primitives/` keeps the
dependency direction clean and lets primitives stay minimal.

**Rules**
- May depend on `primitives/`, `hooks/`, `lib/`, `styles/`, `types/` — **never** the reverse.
- Still **domain-agnostic** in general. The few intentionally domain-aware, but generic, components
  (`PermissionWrapper`, `RoleBadge`, `StatusBadge`) live here and compose primitives + design tokens
  only — they carry no feature/business logic.
- Same per-component folder convention as `primitives/` (`<name>.tsx`, `.variants.ts`,
  `.stories.tsx`, `.test.tsx`, `index.ts`).

`components/index.ts` re-exports every composite; consumed only via the package root.

> No components yet — this folder currently defines structure only.
