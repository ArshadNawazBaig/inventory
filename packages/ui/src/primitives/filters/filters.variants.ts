/**
 * Shared chip styling for Filters and the standalone FilterChip. The wrapper clips its children to a rounded
 * pill; the body and remove segments are split by a divider. Tokens only. Spec: docs/components/filters.md.
 */
export const filterChipClasses = {
  wrapper:
    'inline-flex h-8 items-center overflow-hidden rounded-md border border-border bg-background text-sm',
  body: 'inline-flex h-full items-center gap-1.5 px-2.5 text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[state=open]:bg-accent',
  remove:
    'inline-flex h-full items-center border-l border-border px-1.5 text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
};

/** A row in the add menu / select editor. */
export const filterMenuItem =
  'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent';
