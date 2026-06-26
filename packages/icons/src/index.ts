/**
 * StockFlow icon set — the single source of icons (wraps lucide-react).
 * Consumers import from `@stockflow/icons` only — never `lucide-react`, never raw SVGs.
 * Spec: docs/ICON_SYSTEM.md.
 */
export type { LucideIcon } from 'lucide-react';

// Generic UI icons (no domain meaning — keep library names).
export {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Plus,
  Minus,
  Search,
  Loader2,
} from 'lucide-react';

// Semantic / domain aliases.
export * from './aliases';
