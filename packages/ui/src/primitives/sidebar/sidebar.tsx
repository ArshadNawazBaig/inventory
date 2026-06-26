'use client';

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
} from 'react';
import { Slot } from '@radix-ui/react-slot';
import { PanelLeftIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { Tooltip } from '../tooltip';

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/** Access the sidebar collapse state. Must be used within a `SidebarProvider`. */
export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within <SidebarProvider>');
  return ctx;
}

export interface SidebarProviderProps extends HTMLAttributes<HTMLDivElement> {
  /** Uncontrolled initial collapsed state. */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

/** Holds collapse state and lays out the shell (sidebar + main) as a flex row. */
export const SidebarProvider = forwardRef<HTMLDivElement, SidebarProviderProps>(
  function SidebarProvider(
    { className, defaultCollapsed = false, collapsed: collapsedProp, onCollapsedChange, children, ...props },
    ref,
  ) {
    const [internal, setInternal] = useState(defaultCollapsed);
    const isControlled = collapsedProp !== undefined;
    const collapsed = isControlled ? collapsedProp : internal;

    const setCollapsed = useCallback(
      (next: boolean) => {
        if (!isControlled) setInternal(next);
        onCollapsedChange?.(next);
      },
      [isControlled, onCollapsedChange],
    );
    const toggle = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);
    const value = useMemo(() => ({ collapsed, toggle, setCollapsed }), [collapsed, toggle, setCollapsed]);

    return (
      <SidebarContext.Provider value={value}>
        <div ref={ref} className={cn('flex min-h-svh w-full', className)} {...props}>
          {children}
        </div>
      </SidebarContext.Provider>
    );
  },
);

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  side?: 'left' | 'right';
  collapsible?: 'icon' | 'none';
}

/** The navigation rail. Collapses to an icon rail (`collapsible="icon"`) or stays open (`"none"`). */
export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { className, side = 'left', collapsible = 'icon', children, ...props },
  ref,
) {
  const { collapsed } = useSidebar();
  const state = collapsed && collapsible === 'icon' ? 'collapsed' : 'expanded';
  return (
    <aside
      ref={ref}
      data-state={state}
      data-side={side}
      data-collapsible={collapsible}
      className={cn(
        'group/sidebar flex h-svh flex-col bg-card text-card-foreground transition-[width] duration-200',
        side === 'left' ? 'border-r border-border' : 'order-last border-l border-border',
        state === 'collapsed' ? 'w-16' : 'w-64',
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
});

export const SidebarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function SidebarHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn('flex flex-col gap-2 p-2', className)} {...props} />;
  },
);

export const SidebarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function SidebarContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2', className)}
        {...props}
      />
    );
  },
);

export const SidebarFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function SidebarFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cn('flex flex-col gap-2 border-t border-border p-2', className)} {...props} />;
  },
);

export const SidebarGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function SidebarGroup({ className, ...props }, ref) {
    return <div ref={ref} className={cn('flex flex-col gap-1 py-1', className)} {...props} />;
  },
);

export const SidebarGroupLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function SidebarGroupLabel({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'px-2 py-1 text-xs font-semibold text-muted-foreground',
          'group-data-[state=collapsed]/sidebar:sr-only',
          className,
        )}
        {...props}
      />
    );
  },
);

export const SidebarMenu = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(
  function SidebarMenu({ className, ...props }, ref) {
    return <ul ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />;
  },
);

export const SidebarMenuItem = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(
  function SidebarMenuItem({ className, ...props }, ref) {
    return <li ref={ref} className={cn('list-none', className)} {...props} />;
  },
);

export interface SidebarMenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render onto a child (e.g. a Next `<Link>`). The child supplies the icon + label. */
  asChild?: boolean;
  /** Active/current item. */
  active?: boolean;
  /** Label shown as a right-side tooltip when the sidebar is collapsed. */
  tooltip?: string;
}

/**
 * A nav row. Provide an icon + label as children (e.g. `<ProductIcon /><span>Products</span>`); in the
 * icon rail the row shrinks and the label is **clipped** (kept in the accessible name, not removed).
 * Works with `asChild` (the single child element supplies everything).
 */
export const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  function SidebarMenuButton({ className, asChild = false, active = false, tooltip, children, ...props }, ref) {
    const { collapsed } = useSidebar();
    const Comp: ElementType = asChild ? Slot : 'button';

    const row = (
      <Comp
        ref={ref}
        data-active={active || undefined}
        className={cn(
          'flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-2 text-left text-sm outline-none transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card',
          'data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground',
          'group-data-[state=collapsed]/sidebar:size-8 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:p-0',
          '[&>svg]:size-4 [&>svg]:shrink-0',
          className,
        )}
        {...(asChild ? {} : { type: 'button' as const })}
        {...props}
      >
        {children}
      </Comp>
    );

    if (collapsed && tooltip) {
      return (
        <Tooltip content={tooltip} side="right">
          {row}
        </Tooltip>
      );
    }
    return row;
  },
);

/** Toggles the collapse state. */
export const SidebarTrigger = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function SidebarTrigger({ className, onClick, children, ...props }, ref) {
    const { toggle } = useSidebar();
    return (
      <button
        ref={ref}
        type="button"
        aria-label="Toggle sidebar"
        onClick={(event) => {
          onClick?.(event);
          toggle();
        }}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors',
          'hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...props}
      >
        {children ?? <PanelLeftIcon className="size-4" aria-hidden="true" />}
      </button>
    );
  },
);
