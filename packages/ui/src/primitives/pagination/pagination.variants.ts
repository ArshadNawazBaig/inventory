import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Pagination control style API (cva). One shape, two roles: `page` (numbered cells; the current page
 * fills with the **primary** colour) and `nav` (the prev/next arrows, outlined). Token-mapped so it
 * themes automatically — tokens only, no raw colours. Spec: docs/components/pagination.md.
 */
export const paginationButtonVariants = cva(
  [
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&>svg]:size-4 [&>svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        page: [
          'border border-transparent text-foreground',
          'hover:bg-accent hover:text-accent-foreground',
          'data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground',
          'data-[active=true]:hover:bg-primary',
        ],
        nav: 'border border-input text-foreground hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'h-8 min-w-8 px-2',
        md: 'h-9 min-w-9 px-2.5',
        lg: 'h-10 min-w-10 px-3',
      },
    },
    defaultVariants: {
      variant: 'page',
      size: 'md',
    },
  },
);

export type PaginationButtonVariantProps = VariantProps<typeof paginationButtonVariants>;
