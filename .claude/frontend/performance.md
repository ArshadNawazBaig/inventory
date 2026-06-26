# Frontend Performance

> **Status:** 🟡 Seed · **Owner:** Frontend Lead · **Related:** [nextjs](./nextjs.md) · [tables](./tables.md) · [quality/performance](../quality/performance.md)

## Purpose
Keep the app fast: instant navigation, < 2s interactive dashboards, smooth large lists.

## Budgets (targets)
- LCP < 2.5s, INP < 200ms, CLS < 0.1 on mid-tier hardware.
- Route-level JS kept lean; heavy widgets code-split.

## Tactics
- **RSC by default**; ship minimal client JS. `"use client"` only where required.
- **Code-split** charts, data grid, editors; `next/dynamic` with skeletons.
- **TanStack Query** caching, `staleTime` tuning, prefetch on intent.
- **Virtualize** long lists/tables; server-side pagination.
- **Images** via Cloudinary transforms (right size/format) + `next/image`.
- **Memoize** expensive renders; stable query keys; avoid prop churn.
- Avoid waterfalls — parallelize requests; stream with Suspense.

## Measurement
- Track Web Vitals (PostHog/Sentry); set CI bundle-size checks.
- Profile before optimizing; optimize the measured bottleneck, not a guess.
