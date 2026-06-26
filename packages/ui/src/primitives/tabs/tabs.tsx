'use client';

import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/cn';
import { tabsListVariants, tabsTriggerVariants, type TabsVariant } from './tabs.variants';

/**
 * Root — owns the active tab. `value`/`onValueChange` (controlled) or `defaultValue`. `activationMode`
 * defaults to `"automatic"` (arrow keys switch immediately); use `"manual"` to require Enter/Space.
 */
export const Tabs = TabsPrimitive.Root;

/** Shares the list's `variant` with its triggers (Radix doesn't propagate props down). */
const TabsVariantContext = createContext<TabsVariant>('line');

export interface TabsListProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  /** Visual style applied to the list and its triggers. */
  variant?: TabsVariant;
}

/** The tab rail (`role="tablist"`). */
export const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  function TabsList({ className, variant = 'line', ...props }, ref) {
    return (
      <TabsVariantContext.Provider value={variant}>
        <TabsPrimitive.List
          ref={ref}
          className={cn(tabsListVariants({ variant }), className)}
          {...props}
        />
      </TabsVariantContext.Provider>
    );
  },
);

export interface TabsTriggerProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  /** Override the inherited list variant (rarely needed). */
  variant?: TabsVariant;
}

/** A single tab (`role="tab"`). Active state comes from Radix's `data-state="active"`. */
export const TabsTrigger = forwardRef<ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(
  function TabsTrigger({ className, variant, ...props }, ref) {
    const inherited = useContext(TabsVariantContext);
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(tabsTriggerVariants({ variant: variant ?? inherited }), className)}
        {...props}
      />
    );
  },
);

/** The panel for a tab (`role="tabpanel"`). Inactive panels are unmounted by default. */
export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
      {...props}
    />
  );
});
