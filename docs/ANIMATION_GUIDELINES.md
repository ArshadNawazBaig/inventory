# Animation Guidelines

| Field | Value |
|-------|-------|
| **Document** | Animation & Motion Guidelines |
| **Status** | 🟡 Awaiting approval |
| **Owner** | Senior UI/UX Designer |
| **Date** | 2026-06-26 |
| **Phase** | 4 — Component Design (foundations) |
| **Library** | Framer Motion (`motion` / `motion/react`) + CSS transitions |
| **Tokens** | [DESIGN_SYSTEM.md §9](./DESIGN_SYSTEM.md) · CSS vars in [`packages/ui`](../packages/ui/src/styles/globals.css) · JS in [`packages/ui` motion module](../packages/ui/src/lib/motion.ts) |

> **Motion communicates state and continuity — never decoration.** It should be **fast, subtle,
> purposeful, and accessible**. Default to *not* animating; add motion only when it helps the user
> understand what changed. Every animation **must** honor `prefers-reduced-motion`.

---

## 1. Principles

- **Purposeful** — animate to show cause/effect, continuity, or hierarchy (enter/exit, expand,
  feedback). If it doesn't aid understanding, don't animate.
- **Fast & subtle** — most UI transitions are 120–240ms. If users wait on an animation, it's too slow.
- **Consistent** — use the shared duration/easing tokens; no ad-hoc timings.
- **Cheap** — animate only `transform` and `opacity` (GPU-friendly). Never animate layout
  properties (`width`, `height`, `top`, `left`, `margin`).
- **Accessible** — respect reduced motion; never block interaction waiting for animation; no flashing.

---

## 2. Motion tokens

From the design system; available as CSS vars and JS constants (so CSS and Framer Motion share values).

| Token | Value | Use |
|-------|-------|-----|
| `--duration-fast` / `DURATION.fast` | 120ms | hovers, small state changes |
| `--duration-base` / `DURATION.base` | 180ms | default transitions |
| `--duration-slow` / `DURATION.slow` | 240ms | overlay enter |
| `--duration-slower` / `DURATION.slower` | 320ms | large/page transitions |
| `--ease-standard` / `EASING.standard` | `cubic-bezier(0.2,0,0,1)` | most transitions |
| `--ease-out` / `EASING.out` | `cubic-bezier(0,0,0.2,1)` | **enter** (decelerate) |
| `--ease-in` / `EASING.in` | `cubic-bezier(0.4,0,1,1)` | **exit** (accelerate) |

**Rule of thumb:** enter = slower + `ease-out`; exit = faster + `ease-in`.

---

## 3. Page transitions

- **Subtle and quick** — a short fade (+ ~4–8px upward slide) on route content. Duration ≤ `slower`
  (320ms); never longer.
- **Don't block navigation** — content is interactive immediately; transitions are non-blocking and
  skippable.
- **Respect streaming/SSR** — App Router streams with Suspense; prefer transitioning the *content*
  region, not the whole shell (sidebar/navbar stay put). Avoid full-page reflows.
- **No heavy choreography** between routes (no large slides/zooms) — it feels slow in a data app.
- Reduced motion → instant content swap (opacity only or none).

---

## 4. Hover & interaction effects

- **Fast** (`fast`, 120ms) and on `transform`/`opacity`/`color`/`background` only — **never layout**.
- **Buttons:** background/opacity shift on hover; subtle press (`active:scale-[0.98]`); always a
  visible **focus-visible** ring (focus is not optional, unlike hover).
- **Cards/rows:** background tint or `shadow-sm → shadow-md` on hover; optional ~1–2px lift via
  `translateY` (never animate box size). Table rows: background tint only (no movement).
- **Links/icons:** color transition (`text-muted-foreground → text-foreground`).
- **No layout shift** on hover (reserve space; don't change borders/size that reflow).
- **Touch:** hover effects must not be required — provide active/pressed feedback; don't hide actions
  behind hover-only on touch devices.
- **Disabled:** no hover/press animation; reduced opacity + `cursor-not-allowed`.

---

## 5. Loading states

Pick the right indicator for the wait:

| Situation | Pattern |
|-----------|---------|
| Content with known layout (lists, tables, cards) | **Skeleton** (§6) |
| Action in progress (submit, save) | **Inline button spinner** + disabled, label "Saving…" |
| Short/indeterminate wait (< ~1s, no layout) | small **spinner** (`Loader2`) |
| Determinate long task (import/export/report) | **progress bar/percentage** (from job status) |
| Mutations where rollback is safe | **optimistic UI** (update immediately, reconcile on response) |

- **Don't flash**: if a load resolves in < ~300ms, show nothing (avoid skeleton/spinner flicker).
- **Announce**: set `aria-busy` on the loading region; use `aria-live="polite"` for async results.
- Never replace already-rendered content with a full-screen spinner — load in place.

---

## 6. Skeletons

- Use when the **layout is known** and content is arriving — they reduce perceived wait and prevent
  layout shift.
- **Match the real content's shape** (same sizes/positions) so there's no jump when data lands.
- **Subtle shimmer** (opacity pulse or slow gradient sweep, ~1.5s loop) — never flashy.
- **Threshold:** skip skeletons for sub-300ms loads; show a representative count (e.g., 5–10 table rows).
- **Reduced motion** → static (no shimmer) placeholder blocks.
- One skeleton component per layout type (table row, card, stat) lives in `@stockflow/ui` (component phase).

---

## 7. Modals, drawers & overlays

Built on Radix primitives (component phase); animate via data-state with shared tokens.

| Element | Enter | Exit |
|---------|-------|------|
| **Backdrop** | fade in, `slow` (240ms), `ease-out` | fade out, `fast`, `ease-in` |
| **Modal/Dialog** | fade + scale `0.97 → 1` (+ slight rise), `slow`, `ease-out` | reverse, `fast`, `ease-in` |
| **Drawer/Sheet** | slide from edge + fade, `slow`, `ease-out` | slide out, `fast`, `ease-in` |
| **Popover/Dropdown** | fade + scale `0.98 → 1`, `fast` | fade, `fast` |
| **Tooltip** | fade (+ tiny scale), `fast`, small open delay | instant/`fast` |

- **Always**: focus trap, return focus on close, `Esc` to dismiss, background scroll lock, backdrop
  click closes (unless destructive/confirm).
- Exit animations must not delay perceived dismissal (keep ≤ `fast`).
- Reduced motion → fade only (no scale/slide).

---

## 8. Notifications (toasts)

- **Enter:** slide in + fade from the corner (top-right default), `base`, `ease-out`.
  **Exit:** fade + slight slide/collapse, `fast`, `ease-in`.
- **Stacking:** newest on top; animate siblings to their new position (`transform` only); cap visible
  count (e.g., 3–5) and collapse overflow.
- **Timing:** auto-dismiss ~4–6s (longer for errors/actions); **pause on hover/focus**.
- **A11y:** `aria-live="polite"` for info/success, `assertive` for errors; dismiss button is keyboard
  reachable; never auto-dismiss critical errors that require action.
- Reduced motion → fade only.

---

## 9. Performance considerations

- **Animate `transform` + `opacity` only.** These are GPU-composited; layout/paint properties
  (`width`, `height`, `top`, `left`, `margin`, `box-shadow` on large areas) cause jank.
- Target **60fps**; profile with DevTools (no long frames / layout thrash).
- Use `will-change` **sparingly** (only on actively animating elements; remove after).
- **Lists/tables/virtualized views:** avoid per-row entrance animations on large sets (animate the
  container, not hundreds of rows); never animate during scroll.
- **Bundle:** use Framer Motion's **`LazyMotion`** + `m` components to ship a smaller motion bundle;
  lazy-load heavy/illustrative animations.
- **No animation on first paint** of critical content (don't delay LCP); prefer CSS transitions for
  simple state, Framer Motion for orchestrated/shared-layout cases.
- Debounce/throttle scroll- or pointer-driven animation; avoid many simultaneous large animations.

---

## 10. Accessibility (mandatory)

- **`prefers-reduced-motion: reduce`** is honored globally (already set in the base layer) — reduce
  or remove non-essential motion; keep essential feedback as opacity/instant.
- **No flashing** > 3 times/second (seizure safety).
- **Motion is never the sole signal** of state — pair with text/color/icon.
- Overlay animations never trap focus or delay keyboard dismissal.

---

## 11. Implementation notes

- **CSS transitions** for simple state (hover, focus, show/hide) using token vars.
- **Framer Motion** for orchestration, enter/exit (`AnimatePresence`), shared layout, gestures.
- Shared values live in [`packages/ui` motion module](../packages/ui/src/lib/motion.ts)
  (`DURATION`, `EASING`, `transitions`) so CSS and JS stay in sync.
- Reusable **motion presets/variants** (fade, scale-in, slide) ship in `@stockflow/ui` in the
  component phase; pages/features never hand-roll timings.

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Senior UI/UX Designer / CTO | ☐ Approved ☐ Changes requested | |
