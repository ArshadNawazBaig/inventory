import { cva } from 'class-variance-authority';

/** Visual style of a tab set. `line` = underlined rail (primary indicator); `pill` = segmented control. */
export type TabsVariant = 'line' | 'pill';

/**
 * Tab list (the rail). Two looks: an underlined `line` rail or a `pill` segmented control on a muted
 * track. Token-mapped — themes automatically; tokens only. Spec: docs/components/tabs.md.
 */
export const tabsListVariants = cva('inline-flex items-center', {
  variants: {
    variant: {
      line: 'h-10 w-full justify-start gap-4 border-b border-border',
      pill: 'h-9 gap-1 rounded-lg bg-muted p-1 text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'line' },
});

/**
 * Tab trigger. The active tab is keyed off Radix's `data-[state=active]`: the `line` tab grows a
 * **primary** underline; the `pill` tab raises onto a `background` surface.
 */
export const tabsTriggerVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&>svg]:size-4 [&>svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        line: [
          '-mb-px h-10 border-b-2 border-transparent px-1 text-muted-foreground',
          'hover:text-foreground',
          'data-[state=active]:border-primary data-[state=active]:text-foreground',
        ],
        pill: [
          'h-7 rounded-md px-3 text-muted-foreground',
          'hover:text-foreground',
          'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        ],
      },
    },
    defaultVariants: { variant: 'line' },
  },
);
