import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Badge style API (cva). Two axes: `tone` (intent) × `appearance` (soft/solid/outline), combined via
 * compoundVariants. Token-mapped so it themes automatically. Tokens only — no raw colors.
 * Spec: docs/components/badge.md.
 */
export const badgeVariants = cva(
  ['inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium transition-colors'],
  {
    variants: {
      appearance: {
        soft: '',
        solid: '',
        outline: 'border bg-transparent',
      },
      tone: {
        neutral: '',
        primary: '',
        success: '',
        warning: '',
        danger: '',
        info: '',
      },
      size: {
        sm: 'h-5 px-2 text-[11px]',
        md: 'h-6 px-2.5 text-xs',
      },
    },
    compoundVariants: [
      // soft (tinted)
      { appearance: 'soft', tone: 'neutral', class: 'bg-muted text-foreground' },
      { appearance: 'soft', tone: 'primary', class: 'bg-primary/12 text-primary' },
      { appearance: 'soft', tone: 'success', class: 'bg-success/15 text-success' },
      { appearance: 'soft', tone: 'warning', class: 'bg-warning/15 text-warning' },
      { appearance: 'soft', tone: 'danger', class: 'bg-destructive/12 text-destructive' },
      { appearance: 'soft', tone: 'info', class: 'bg-info/12 text-info' },
      // solid (filled)
      { appearance: 'solid', tone: 'neutral', class: 'bg-foreground text-background' },
      { appearance: 'solid', tone: 'primary', class: 'bg-primary text-primary-foreground' },
      { appearance: 'solid', tone: 'success', class: 'bg-success text-success-foreground' },
      { appearance: 'solid', tone: 'warning', class: 'bg-warning text-warning-foreground' },
      { appearance: 'solid', tone: 'danger', class: 'bg-destructive text-destructive-foreground' },
      { appearance: 'solid', tone: 'info', class: 'bg-info text-info-foreground' },
      // outline
      { appearance: 'outline', tone: 'neutral', class: 'border-border text-foreground' },
      { appearance: 'outline', tone: 'primary', class: 'border-primary/40 text-primary' },
      { appearance: 'outline', tone: 'success', class: 'border-success/40 text-success' },
      { appearance: 'outline', tone: 'warning', class: 'border-warning/40 text-warning' },
      { appearance: 'outline', tone: 'danger', class: 'border-destructive/40 text-destructive' },
      { appearance: 'outline', tone: 'info', class: 'border-info/40 text-info' },
    ],
    defaultVariants: {
      appearance: 'soft',
      tone: 'neutral',
      size: 'md',
    },
  },
);

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;
