# `hooks/` — UI behavior hooks

Reusable React hooks for **UI behavior** used by components in this package: e.g.
`useDisclosure` (open/close state), `useControllableState` (controlled/uncontrolled prop pattern),
`useMediaQuery`, `useIsomorphicLayoutEffect`, `useFocusTrap`.

**Why it exists:** behavior shared across multiple components belongs in one place, not copy-pasted
into each component. Keeps components small and logic testable in isolation.

**`hooks/` here vs the `@stockflow/hooks` package**
- **`packages/ui/src/hooks`** — hooks tightly coupled to design-system components/primitives.
- **`@stockflow/hooks`** — general-purpose, app-wide hooks not specific to the UI library.

**Rules**
- May use `lib/` and `types/`; must not import `components/` or `primitives/` (avoid cycles).
- Client-only hooks are fine here; mark consuming components `"use client"` as needed.

> No hooks yet — this folder currently defines structure only.
