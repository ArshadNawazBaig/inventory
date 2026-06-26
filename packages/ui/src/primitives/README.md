# `primitives/` — foundational components

The smallest, single-purpose building blocks of the design system (atoms): Button, Input,
Checkbox, Switch, Select, Badge, Avatar, Label, etc.

**Why it exists:** these are the irreducible UI elements everything else is built from. Keeping
them separate from composites makes dependencies one-directional (`components/` → `primitives/`,
never the reverse) and keeps each primitive tiny and testable.

**Rules**
- Built on Radix primitives where applicable; accessible by default.
- Depend only on `lib/`, `styles/`, `types/`, and Radix — **never** on `components/` and **never**
  on domain/app code.
- No business logic, no data fetching, no domain knowledge.

**Per-component folder convention** (one self-contained folder each):
```
primitives/button/
  button.tsx          # implementation (RSC-safe; "use client" only if it needs interactivity)
  button.variants.ts  # cva variant definitions (the style API)
  button.stories.tsx  # Storybook story (all variants/states)
  button.test.tsx     # unit + a11y test
  index.ts            # public re-export for this primitive
```
`primitives/index.ts` re-exports every primitive; nothing here is imported by apps directly —
only through the package root (`@stockflow/ui`).

> No components yet — this folder currently defines structure only.
