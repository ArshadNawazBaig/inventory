import { cva, type VariantProps } from 'class-variance-authority';

export type NotificationTone = 'info' | 'success' | 'warning' | 'error' | 'neutral';
export type NotificationAppearance = 'soft' | 'outline' | 'solid';

/**
 * Notification banner surface — tone × appearance on design tokens (themes light/dark with AA contrast).
 * `soft` = tinted surface, `outline` = neutral surface + tone border, `solid` = filled tone surface with
 * its `-foreground` text. Tone is reinforced by a coloured icon (set in the component), never colour alone.
 * Spec: docs/components/notification.md.
 */
export const notificationVariants = cva('relative flex w-full gap-3 rounded-lg border p-4 text-sm', {
  variants: {
    tone: { info: '', success: '', warning: '', error: '', neutral: '' },
    appearance: { soft: '', outline: '', solid: '' },
  },
  compoundVariants: [
    // soft — tinted surface
    { appearance: 'soft', tone: 'info', class: 'border-info/20 bg-info/10 text-foreground' },
    { appearance: 'soft', tone: 'success', class: 'border-success/20 bg-success/10 text-foreground' },
    { appearance: 'soft', tone: 'warning', class: 'border-warning/20 bg-warning/10 text-foreground' },
    { appearance: 'soft', tone: 'error', class: 'border-destructive/20 bg-destructive/10 text-foreground' },
    { appearance: 'soft', tone: 'neutral', class: 'border-border bg-muted/50 text-foreground' },
    // outline — neutral surface, tone border
    { appearance: 'outline', tone: 'info', class: 'border-info/40 bg-background text-foreground' },
    { appearance: 'outline', tone: 'success', class: 'border-success/40 bg-background text-foreground' },
    { appearance: 'outline', tone: 'warning', class: 'border-warning/40 bg-background text-foreground' },
    { appearance: 'outline', tone: 'error', class: 'border-destructive/40 bg-background text-foreground' },
    { appearance: 'outline', tone: 'neutral', class: 'border-border bg-background text-foreground' },
    // solid — filled tone surface
    { appearance: 'solid', tone: 'info', class: 'border-transparent bg-info text-info-foreground' },
    { appearance: 'solid', tone: 'success', class: 'border-transparent bg-success text-success-foreground' },
    { appearance: 'solid', tone: 'warning', class: 'border-transparent bg-warning text-warning-foreground' },
    { appearance: 'solid', tone: 'error', class: 'border-transparent bg-destructive text-destructive-foreground' },
    { appearance: 'solid', tone: 'neutral', class: 'border-transparent bg-foreground text-background' },
  ],
  defaultVariants: { tone: 'info', appearance: 'soft' },
});

export type NotificationVariantProps = VariantProps<typeof notificationVariants>;
