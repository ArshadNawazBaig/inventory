import {
  forwardRef,
  type HTMLAttributes,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** Class for the horizontal-scroll wrapper (e.g. a max-height for a sticky header). */
  wrapperClassName?: string;
}

/**
 * Table — semantic, token-skinned `<table>` primitives (no logic). Wrapped in a horizontal-scroll
 * container so wide tables don't overflow the layout. For sorting/selection/pagination, compose these
 * with TanStack Table in a DataGrid. Spec: docs/components/table.md.
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, wrapperClassName, ...props },
  ref,
) {
  return (
    <div className={cn('relative w-full overflow-x-auto', wrapperClassName)}>
      <table
        ref={ref}
        className={cn('w-full caption-bottom border-collapse text-sm', className)}
        {...props}
      />
    </div>
  );
});

/** Table header group (`<thead>`). */
export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cn('[&_tr]:border-b [&_tr]:border-border', className)} {...props} />;
});

/** Table body (`<tbody>`). */
export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableBody({ className, ...props }, ref) {
    return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
  },
);

/** Table footer (`<tfoot>`) — for totals/summaries. */
export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableFooter({ className, ...props }, ref) {
  return (
    <tfoot
      ref={ref}
      className={cn(
        'border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  );
});

/** A row (`<tr>`). Set `data-state="selected"` to highlight it. */
export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  function TableRow({ className, ...props }, ref) {
    return (
      <tr
        ref={ref}
        className={cn(
          'border-b border-border transition-colors',
          'hover:bg-muted/50 data-[state=selected]:bg-accent',
          className,
        )}
        {...props}
      />
    );
  },
);

/** A column header cell (`<th>`, defaults to `scope="col"`). */
export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  function TableHead({ className, scope = 'col', ...props }, ref) {
    return (
      <th
        ref={ref}
        scope={scope}
        className={cn(
          'h-10 whitespace-nowrap px-3 text-left align-middle text-xs font-medium text-muted-foreground',
          '[&:has([role=checkbox])]:pr-0',
          className,
        )}
        {...props}
      />
    );
  },
);

/** A data cell (`<td>`). Add `text-right tabular-nums` for numeric columns. */
export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  function TableCell({ className, ...props }, ref) {
    return (
      <td
        ref={ref}
        className={cn('whitespace-nowrap p-3 align-middle', '[&:has([role=checkbox])]:pr-0', className)}
        {...props}
      />
    );
  },
);

/** Accessible caption (`<caption>`) — names the table; rendered at the bottom. */
export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  HTMLAttributes<HTMLTableCaptionElement>
>(function TableCaption({ className, ...props }, ref) {
  return <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />;
});
