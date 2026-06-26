# Next.js

> **Status:** 🟡 Seed · **Owner:** Frontend Lead · **Related:** [routing](./routing.md) · [state-management](./state-management.md) · [folder-structure](../architecture/folder-structure.md)

## Purpose
Conventions for the `apps/web` Next.js application (App Router, latest).

## Principles
- **App Router** with React Server Components by default; Client Components only when needed
  (interactivity, hooks, browser APIs) — mark with `"use client"` at the leaf, not the root.
- **Server-first data fetching** for initial render; TanStack Query for client cache & mutations.
- **Feature-first** structure under `src/features/<feature>`; routes stay thin.
- All UI from `@stockflow/ui` — never build primitives in pages. See [ui/component-rules](../ui/component-rules.md).

## Rules
- No data fetching logic in components — use `features/<feature>/queries`.
- Co-locate Zod schemas in `packages/types` so client and server share contracts.
- Use the typed API client (`lib/api`) — no raw `fetch` scattered around.
- Environment access via a validated config module; never read `process.env` ad hoc in components.
- Loading/error/empty states are mandatory for every async view (use design-system states).

## Performance defaults
- Stream with Suspense; prefetch on hover/intent; lazy-load heavy widgets (charts, data grid).
- Optimize images via Cloudinary transformations + Next image. See [performance](./performance.md).
