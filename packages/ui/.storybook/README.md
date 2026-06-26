# `.storybook/` — Storybook configuration

Holds the Storybook setup for developing, documenting, and a11y-testing components in isolation
(the design system's living catalog).

**Why it exists:** every component ships with a story (per our standards). Storybook is the canonical
place to view variants/states, run accessibility checks (`@storybook/addon-a11y`), and review UI
without booting the whole app.

**Will contain (component phase):**
- `main.ts` — framework/builder config, story globs, addons.
- `preview.tsx` — global decorators: imports `@stockflow/ui/styles.css`, theme (light/dark) toggle,
  viewport/backgrounds.

> Config is added when Storybook is installed in Phase 4 (roadmap P2). Folder reserved for now.
