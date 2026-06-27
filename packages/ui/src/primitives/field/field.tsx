'use client';

import {
  cloneElement,
  createContext,
  forwardRef,
  useContext,
  useId,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';

/**
 * The wiring `Field` shares with its parts. `controlId` labels the control; `descriptionId`/`errorId`
 * are the targets for `aria-describedby`. Internal — consumers compose the exported parts instead.
 */
interface FieldContextValue {
  controlId: string;
  descriptionId: string;
  errorId: string;
  hasError: boolean;
  hasDescription: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

function useFieldContext(component: string): FieldContextValue {
  const ctx = useContext(FieldContext);
  if (!ctx) {
    throw new Error(`<${component}> must be rendered inside <Field>.`);
  }
  return ctx;
}

/** True when a label/error/description value is meaningful (not null/undefined/false/empty string). */
function isPresent(value: ReactNode): boolean {
  return value != null && value !== false && value !== '';
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Visible label, associated with the control via `htmlFor`. */
  label?: ReactNode;
  /** Hint shown under the control; linked via `aria-describedby` (hidden while an error shows). */
  description?: ReactNode;
  /** Error message; its presence flips the control into the invalid state and is announced. */
  error?: ReactNode;
  /** Marks the control required — renders a `*` and sets `aria-required`. */
  required?: boolean;
  /** Override the auto-generated control id (e.g. to match an external `id`). */
  htmlFor?: string;
  /** The control, wrapped in a single `<FieldControl>`. */
  children: ReactNode;
}

/**
 * Field — the accessible host that labels, describes, and reports errors for a single form control.
 * It owns the ids and wires `htmlFor` / `aria-describedby` / `aria-invalid` / `aria-required` so pages
 * never hand-roll that markup. Wrap any `@stockflow/ui` control in `<FieldControl>`:
 *
 * ```tsx
 * <Field label="SKU" required error={errors.sku?.message}>
 *   <FieldControl>
 *     <Input {...register('sku')} />
 *   </FieldControl>
 * </Field>
 * ```
 *
 * Spec & a11y rules: docs/components/field.md.
 */
export function Field({
  label,
  description,
  error,
  required = false,
  htmlFor,
  className,
  children,
  ...props
}: FieldProps) {
  const reactId = useId();
  const hasError = isPresent(error);
  const hasDescription = isPresent(description);

  const ctx: FieldContextValue = {
    controlId: htmlFor ?? `${reactId}-control`,
    descriptionId: `${reactId}-description`,
    errorId: `${reactId}-error`,
    hasError,
    hasDescription,
    required,
  };

  return (
    <FieldContext.Provider value={ctx}>
      <div className={cn('flex flex-col gap-1.5', className)} {...props}>
        {isPresent(label) ? <FieldLabel>{label}</FieldLabel> : null}
        {children}
        {hasDescription && !hasError ? <FieldDescription>{description}</FieldDescription> : null}
        {hasError ? <FieldError>{error}</FieldError> : null}
      </div>
    </FieldContext.Provider>
  );
}

export type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

/** The control's `<label>` — points at the control id and appends a required marker. */
export const FieldLabel = forwardRef<HTMLLabelElement, FieldLabelProps>(function FieldLabel(
  { className, children, ...props },
  ref,
) {
  const ctx = useFieldContext('FieldLabel');
  return (
    <label
      ref={ref}
      htmlFor={ctx.controlId}
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    >
      {children}
      {ctx.required ? (
        <span className="ml-0.5 text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
});

/** Muted hint under the control. Linked to the control via `aria-describedby`. */
export const FieldDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  function FieldDescription({ className, ...props }, ref) {
    const ctx = useFieldContext('FieldDescription');
    return (
      <p
        ref={ref}
        id={ctx.descriptionId}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  },
);

/** The error message — announced politely and linked to the control via `aria-describedby`. */
export const FieldError = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  function FieldError({ className, ...props }, ref) {
    const ctx = useFieldContext('FieldError');
    return (
      <p
        ref={ref}
        id={ctx.errorId}
        aria-live="polite"
        className={cn('text-sm font-medium text-destructive', className)}
        {...props}
      />
    );
  },
);

export interface FieldControlProps {
  /** A single form control element (Input, Textarea, SelectTrigger, …) to receive the field wiring. */
  children: ReactElement;
}

/**
 * Wraps the actual control and injects the field's id + aria wiring (and the `invalid` flag on error).
 * Use it around the focusable element — for Select that is the `SelectTrigger`, not the root.
 */
export function FieldControl({ children }: FieldControlProps) {
  const ctx = useFieldContext('FieldControl');
  const describedBy = ctx.hasError
    ? ctx.errorId
    : ctx.hasDescription
      ? ctx.descriptionId
      : undefined;

  const injected: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;
    invalid?: boolean;
  } = { id: ctx.controlId };

  if (describedBy) injected['aria-describedby'] = describedBy;
  if (ctx.hasError) {
    injected['aria-invalid'] = true;
    injected.invalid = true;
  }
  if (ctx.required) injected['aria-required'] = true;

  return cloneElement(children, injected);
}
