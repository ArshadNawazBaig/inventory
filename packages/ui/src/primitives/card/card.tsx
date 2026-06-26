import { forwardRef, type ElementType, type HTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/cn';
import { cardVariants } from './card.variants';

export type CardVariant = 'default' | 'elevated' | 'ghost';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Surface treatment. */
  variant?: CardVariant;
  /** Hover/focus affordance for clickable cards (pair with `asChild`). */
  interactive?: boolean;
  /** Render the surface onto the child element (e.g. an `<a>` for a clickable card). */
  asChild?: boolean;
}

/**
 * Card — the canonical composable surface. Compose with CardHeader/Title/Description/Content/Footer.
 * For a clickable card use `asChild` so it renders a real `<a>`/`<button>`. Spec: docs/components/card.md.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant, interactive, asChild = false, ...props },
  ref,
) {
  const Comp: ElementType = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref}
      className={cn(cardVariants({ variant, interactive: interactive ?? false }), className)}
      {...props}
    />
  );
});

/** Header block — stacks the title + description. */
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn('flex flex-col gap-1.5 px-6', className)} {...props} />;
  },
);

/** Card title. Pass `asChild`-free; for a section heading wrap your own heading element. */
export const CardTitle = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
    );
  },
);

/** Muted supporting text under the title. */
export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  function CardDescription({ className, ...props }, ref) {
    return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />;
  },
);

/** Main content region. */
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn('px-6', className)} {...props} />;
  },
);

/** Footer — typically actions, right-aligned by the consumer. */
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cn('flex items-center gap-2 px-6', className)} {...props} />;
  },
);
