# `types/` — shared component types

Cross-cutting TypeScript types and helpers used across the library: shared prop unions
(`Size`, `Tone`/`Variant`), polymorphism helpers (`AsProp`/`asChild` support), and common prop
shapes so components stay consistent and strongly typed.

**Why it exists:** without a shared vocabulary, every component invents its own `size`/`variant`
types and they drift. Centralizing them keeps the component API coherent (a `sm` means the same
thing everywhere) and avoids duplication.

**Rules**
- Pure type declarations only — no runtime code.
- No dependency on `primitives/`/`components/` (it sits below them).
- Distinct from `@stockflow/types` (which holds **domain/API** contracts); this folder is
  **UI-only** prop typing.

> Defines structure only — populated alongside the first components.
