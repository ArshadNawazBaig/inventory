# `styles/` — global theme & tokens

The design system's CSS layer.

**Current contents**
- `globals.css` — Tailwind v4 CSS-first theme: primitive token ramps (`@theme`), semantic
  light/dark variables (`:root` / `.dark`), the `@theme inline` mapping that generates utilities
  (`bg-primary`, `text-muted-foreground`…), and the base layer (focus ring, reduced motion,
  tabular-nums). Spec: [DESIGN_SYSTEM.md](../../../../docs/DESIGN_SYSTEM.md).

**Why it exists:** tokens are the single source of visual truth; centralizing them here means apps
import one stylesheet and every component inherits the same theme + dark mode automatically.

**Exposed via** the package `exports` map as `@stockflow/ui/styles.css`; apps import it once
(after `@import "tailwindcss"`). Future: animation `@keyframes` live here too.
