# `lib/` — framework-agnostic utilities

Pure, stateless helpers the components rely on. **No React state, no JSX.**

**Current contents**
- `cn.ts` — Tailwind-aware class name merge (`clsx` + `tailwind-merge`).
- `motion.ts` — motion tokens (`DURATION`, `EASING`, `transitions`) mirroring the CSS vars, for
  Framer Motion. See [ANIMATION_GUIDELINES.md](../../../../docs/ANIMATION_GUIDELINES.md).

**Why it exists:** small utilities used by many components belong in one tested place, and keeping
them free of React/state makes them trivial to unit-test and safe to import anywhere.

**Likely additions:** a `cva` variant helper wrapper, focus/keyboard utilities, id generation.

**Rules:** no imports from `components/`/`primitives/`/`hooks/` (this is the lowest layer).
