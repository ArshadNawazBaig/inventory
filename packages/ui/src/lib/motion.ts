/**
 * Motion tokens (JS) — mirror the CSS duration/easing vars so Framer Motion and CSS
 * transitions share the same values. Spec: docs/ANIMATION_GUIDELINES.md.
 * Pure constants (no framer-motion dependency); components feed these into `motion`.
 */

/** Cubic-bezier control points (Framer Motion `ease` / CSS easing). */
type Bezier = [number, number, number, number];

/** Durations in seconds (Framer Motion uses seconds; ×1000 for CSS ms). */
export const DURATION = {
  fast: 0.12,
  base: 0.18,
  slow: 0.24,
  slower: 0.32,
} as const;

export const EASING: Record<'standard' | 'out' | 'in', Bezier> = {
  standard: [0.2, 0, 0, 1],
  out: [0, 0, 0.2, 1],
  in: [0.4, 0, 1, 1],
};

/** Common transition presets. Enter = slower + ease-out; exit = faster + ease-in. */
export const transitions = {
  base: { duration: DURATION.base, ease: EASING.standard },
  enter: { duration: DURATION.slow, ease: EASING.out },
  exit: { duration: DURATION.fast, ease: EASING.in },
} as const;
