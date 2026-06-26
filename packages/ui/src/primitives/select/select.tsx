'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp, type LucideIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { selectTriggerVariants, type SelectTriggerVariantProps } from './select.variants';

export type SelectVariant = 'default' | 'filled' | 'ghost';
export type SelectSize = 'sm' | 'md' | 'lg';

/** Root — owns the value. `value`/`defaultValue`/`onValueChange`/`name`/`disabled`/`required`. */
export const Select = SelectPrimitive.Root;
/** Groups related items under a `SelectLabel`. */
export const SelectGroup = SelectPrimitive.Group;
/** Renders the selected value / placeholder inside the trigger (used internally by SelectTrigger). */
export const SelectValue = SelectPrimitive.Value;

export interface SelectTriggerProps
  extends Omit<ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>, 'children'>,
    SelectTriggerVariantProps {
  /** Error state — applies error styling and sets `aria-invalid`. */
  invalid?: boolean;
  /** Decorative icon at the start. */
  leadingIcon?: LucideIcon;
  /** Placeholder shown when no value is selected. */
  placeholder?: string;
}

/** The clickable field. Renders the current value + a chevron; styled to match Input. */
export const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(function SelectTrigger(
  {
    className,
    variant,
    inputSize = 'md',
    invalid,
    leadingIcon: LeadingIcon,
    placeholder,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref,
) {
  const iconClass = inputSize === 'lg' ? 'size-5' : 'size-4';
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      aria-invalid={invalid ? true : ariaInvalid}
      className={cn(
        selectTriggerVariants({ variant, inputSize, invalid: invalid ?? false }),
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-2">
        {LeadingIcon ? (
          <LeadingIcon className={cn(iconClass, 'shrink-0 text-muted-foreground')} aria-hidden="true" />
        ) : null}
        <SelectPrimitive.Value placeholder={placeholder} />
      </span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className={cn(iconClass, 'shrink-0 text-muted-foreground')} aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

const ScrollButton = 'flex cursor-default items-center justify-center py-1 text-muted-foreground';

export const SelectScrollUpButton = forwardRef<
  ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(function SelectScrollUpButton({ className, ...props }, ref) {
  return (
    <SelectPrimitive.ScrollUpButton ref={ref} className={cn(ScrollButton, className)} {...props}>
      <ChevronUp className="size-4" aria-hidden="true" />
    </SelectPrimitive.ScrollUpButton>
  );
});

export const SelectScrollDownButton = forwardRef<
  ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(function SelectScrollDownButton({ className, ...props }, ref) {
  return (
    <SelectPrimitive.ScrollDownButton ref={ref} className={cn(ScrollButton, className)} {...props}>
      <ChevronDown className="size-4" aria-hidden="true" />
    </SelectPrimitive.ScrollDownButton>
  );
});

/** The portalled popover listing options. Width matches the trigger in `popper` mode. */
export const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = 'popper', ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        className={cn(
          'relative z-50 max-h-[var(--radix-select-content-available-height)] min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          className,
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' && 'w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

/** A non-selectable heading for a `SelectGroup`. */
export const SelectLabel = forwardRef<
  ElementRef<typeof SelectPrimitive.Label>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)}
      {...props}
    />
  );
});

export interface SelectItemProps
  extends ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  /** Decorative icon at the start of the item. */
  icon?: LucideIcon;
  /** Secondary line shown under the label. */
  description?: string;
}

/** A selectable option. Shows a leading icon + optional description; a check marks the selected one. */
export const SelectItem = forwardRef<ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(
  function SelectItem({ className, children, icon: Icon, description, ...props }, ref) {
    return (
      <SelectPrimitive.Item
        ref={ref}
        className={cn(
          'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none',
          'focus:bg-accent focus:text-accent-foreground',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          className,
        )}
        {...props}
      >
        {Icon ? (
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : null}
        <span className="flex min-w-0 flex-col">
          <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
          {description ? (
            <span className="truncate text-xs text-muted-foreground">{description}</span>
          ) : null}
        </span>
        <span className="absolute right-2 flex size-4 items-center justify-center">
          <SelectPrimitive.ItemIndicator>
            <Check className="size-4" aria-hidden="true" />
          </SelectPrimitive.ItemIndicator>
        </span>
      </SelectPrimitive.Item>
    );
  },
);

/** A divider between groups of items. */
export const SelectSeparator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectSeparator({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
});
