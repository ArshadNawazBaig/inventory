import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
} from 'react';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRightIcon, MoreIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';

/** The breadcrumb trail — a `<nav>` (navigation landmark) labelled "Breadcrumb" by default. */
export const Breadcrumb = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function Breadcrumb(
  { className, ...props },
  ref,
) {
  return <nav ref={ref} aria-label="Breadcrumb" className={className} {...props} />;
});

/** The ordered list of crumbs and separators. */
export const BreadcrumbList = forwardRef<HTMLOListElement, HTMLAttributes<HTMLOListElement>>(
  function BreadcrumbList({ className, ...props }, ref) {
    return (
      <ol
        ref={ref}
        className={cn(
          'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
          className,
        )}
        {...props}
      />
    );
  },
);

/** A single crumb (wraps a link, the current page, or an ellipsis). */
export const BreadcrumbItem = forwardRef<HTMLLIElement, LiHTMLAttributes<HTMLLIElement>>(
  function BreadcrumbItem({ className, ...props }, ref) {
    return <li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props} />;
  },
);

export interface BreadcrumbLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Render onto a child (e.g. a Next `<Link>`). */
  asChild?: boolean;
}

/** A navigable crumb. Defaults to an `<a>`; use `asChild` for a framework link. */
export const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  function BreadcrumbLink({ className, asChild = false, ...props }, ref) {
    const Comp: ElementType = asChild ? Slot : 'a';
    return (
      <Comp
        ref={ref}
        className={cn(
          'rounded-sm transition-colors hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...props}
      />
    );
  },
);

/** The current page — non-interactive, marked `aria-current="page"`. */
export const BreadcrumbPage = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function BreadcrumbPage({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        aria-current="page"
        className={cn('font-medium text-foreground', className)}
        {...props}
      />
    );
  },
);

export interface BreadcrumbSeparatorProps extends LiHTMLAttributes<HTMLLIElement> {
  children?: ReactNode;
}

/** Visual divider between crumbs (decorative). Defaults to a chevron; pass children to override. */
export const BreadcrumbSeparator = forwardRef<HTMLLIElement, BreadcrumbSeparatorProps>(
  function BreadcrumbSeparator({ className, children, ...props }, ref) {
    return (
      <li
        ref={ref}
        role="presentation"
        aria-hidden="true"
        className={cn('[&>svg]:size-3.5', className)}
        {...props}
      >
        {children ?? <ChevronRightIcon />}
      </li>
    );
  },
);

/** Collapsed-crumbs marker (decorative). Wrap in a `DropdownMenu` to expose the hidden routes. */
export const BreadcrumbEllipsis = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function BreadcrumbEllipsis({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        role="presentation"
        aria-hidden="true"
        className={cn('flex size-5 items-center justify-center [&>svg]:size-4', className)}
        {...props}
      >
        <MoreIcon />
      </span>
    );
  },
);
