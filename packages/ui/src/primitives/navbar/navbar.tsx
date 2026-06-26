import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
} from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/cn';

export interface NavbarProps extends HTMLAttributes<HTMLElement> {
  /** Stick to the top of the viewport (default true). */
  sticky?: boolean;
}

/** The app-shell top bar — a `<header>` (banner landmark). */
export const Navbar = forwardRef<HTMLElement, NavbarProps>(function Navbar(
  { className, sticky = true, ...props },
  ref,
) {
  return (
    <header
      ref={ref}
      className={cn(
        'flex h-14 items-center gap-3 border-b border-border bg-background px-4',
        sticky && 'sticky top-0 z-30',
        className,
      )}
      {...props}
    />
  );
});

export interface NavbarBrandProps extends HTMLAttributes<HTMLDivElement> {
  /** Render onto a child (e.g. a link to home). */
  asChild?: boolean;
}

/** Brand/logo block. */
export const NavbarBrand = forwardRef<HTMLDivElement, NavbarBrandProps>(function NavbarBrand(
  { className, asChild = false, ...props },
  ref,
) {
  const Comp: ElementType = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref}
      className={cn('flex items-center gap-2 font-semibold [&>svg]:size-5', className)}
      {...props}
    />
  );
});

/** Horizontal navigation region — give it an `aria-label`. */
export const NavbarNav = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function NavbarNav(
  { className, ...props },
  ref,
) {
  return <nav ref={ref} className={cn('flex items-center gap-1', className)} {...props} />;
});

export interface NavbarLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Render onto a child (e.g. a Next `<Link>`). */
  asChild?: boolean;
  /** Current route. */
  active?: boolean;
}

/** A horizontal nav link. Defaults to an `<a>`; set `aria-current="page"` on the active route. */
export const NavbarLink = forwardRef<HTMLAnchorElement, NavbarLinkProps>(function NavbarLink(
  { className, asChild = false, active = false, ...props },
  ref,
) {
  const Comp: ElementType = asChild ? Slot : 'a';
  return (
    <Comp
      ref={ref}
      data-active={active || undefined}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'data-[active=true]:bg-primary data-[active=true]:text-primary-foreground',
        '[&>svg]:size-4 [&>svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
});

/** Flexible gap that pushes following content to the right. */
export function NavbarSpacer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn('flex-1', className)} {...props} />;
}

/** Right-aligned actions group (search, icons, avatar/menu). */
export const NavbarActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function NavbarActions({ className, ...props }, ref) {
    return <div ref={ref} className={cn('flex items-center gap-1', className)} {...props} />;
  },
);
