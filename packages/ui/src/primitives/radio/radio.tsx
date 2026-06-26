'use client';

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '../../lib/cn';
import { radioItemVariants, radioDotVariants } from './radio.variants';

export type RadioSize = 'sm' | 'md';
export type RadioAppearance = 'standard' | 'card';

interface RadioGroupContextValue {
  size: RadioSize;
  invalid: boolean;
}
const RadioGroupContext = createContext<RadioGroupContextValue>({ size: 'md', invalid: false });

export interface RadioGroupProps
  extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  /** Dot/label size for all items. */
  size?: RadioSize;
  /** Group-level error styling; sets `aria-invalid`. */
  invalid?: boolean;
}

/**
 * RadioGroup — owns the single selected value; the unit is the group, not the item. Provides
 * roving-tabindex arrow-key navigation via Radix. Wrap in `Field` (fieldset/legend) for a group label.
 * Spec: docs/components/radio.md.
 */
export const RadioGroup = forwardRef<ElementRef<typeof RadioGroupPrimitive.Root>, RadioGroupProps>(
  function RadioGroup(
    { className, size = 'md', invalid = false, 'aria-invalid': ariaInvalid, ...props },
    ref,
  ) {
    return (
      <RadioGroupContext.Provider value={{ size, invalid }}>
        <RadioGroupPrimitive.Root
          ref={ref}
          aria-invalid={invalid ? true : ariaInvalid}
          className={cn(
            'grid gap-2 data-[orientation=horizontal]:auto-cols-max data-[orientation=horizontal]:grid-flow-col',
            className,
          )}
          {...props}
        />
      </RadioGroupContext.Provider>
    );
  },
);

export interface RadioGroupItemProps
  extends Omit<ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>, 'asChild'> {
  /** `standard` (dot + label) or `card` (selectable card). */
  appearance?: RadioAppearance;
}

/** A single option. The dot is decorative; the accessible name comes from the children (label). */
export const RadioGroupItem = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(function RadioGroupItem({ className, children, appearance = 'standard', id, ...props }, ref) {
  const { size, invalid } = useContext(RadioGroupContext);
  const generatedId = useId();
  const itemId = id ?? generatedId;
  const innerDotClass = size === 'sm' ? 'size-2' : 'size-2.5';

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={itemId}
      className={cn(radioItemVariants({ appearance, invalid }), className)}
      {...props}
    >
      <span className={cn(radioDotVariants({ size, invalid }))} aria-hidden="true">
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <span className={cn('block rounded-full bg-primary', innerDotClass)} />
        </RadioGroupPrimitive.Indicator>
      </span>
      {children != null ? (
        <span className={appearance === 'card' ? 'flex min-w-0 flex-col gap-0.5' : undefined}>
          {children}
        </span>
      ) : null}
    </RadioGroupPrimitive.Item>
  );
});
