'use client';

import {
  forwardRef,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { Eye, EyeOff, Loader2, X, type LucideIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { inputVariants } from './input.variants';

export type InputVariant = 'default' | 'filled' | 'ghost';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Visual treatment. */
  variant?: InputVariant;
  /** Field height/padding/font (named to avoid the native `size` attribute). */
  inputSize?: InputSize;
  /** Error state — applies error styling and sets `aria-invalid`. */
  invalid?: boolean;
  /** Decorative icon at the start. */
  leadingIcon?: LucideIcon;
  /** Decorative icon at the end. */
  trailingIcon?: LucideIcon;
  /** Static addon at the start (e.g. "$", "https://"). */
  prefix?: ReactNode;
  /** Static addon at the end (e.g. "kg", ".00"). */
  suffix?: ReactNode;
  /** Show a clear (✕) button when there is a value. */
  clearable?: boolean;
  /** Show a trailing spinner (e.g. async validation). */
  loading?: boolean;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
}

const adornmentButton =
  'shrink-0 rounded-sm text-muted-foreground transition-colors hover:text-foreground ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
  'disabled:pointer-events-none';

/**
 * Input — a bare single-line control. Labels, descriptions, and error messages live in `Field`
 * (compose them for accessible forms). Spec & a11y rules: docs/components/input.md.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    variant,
    inputSize = 'md',
    invalid,
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    prefix,
    suffix,
    clearable = false,
    loading = false,
    onClear,
    disabled,
    type = 'text',
    value,
    defaultValue,
    onChange,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref,
) {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue != null ? String(defaultValue) : '');
  const [showPassword, setShowPassword] = useState(false);

  const currentValue = isControlled ? value : internalValue;
  const hasValue = currentValue != null && String(currentValue).length > 0;

  const isPassword = type === 'password';
  const effectiveType = isPassword && showPassword ? 'text' : type;
  const iconClass = inputSize === 'lg' ? 'size-5' : 'size-4';
  const showClear = clearable && hasValue && !disabled && !loading;

  const setRefs = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalValue(event.target.value);
    onChange?.(event);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
      if (innerRef.current) innerRef.current.value = '';
    }
    onClear?.();
    innerRef.current?.focus();
  };

  return (
    <div
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      className={cn(
        inputVariants({
          variant,
          inputSize,
          invalid: invalid ?? false,
          disabled: disabled ?? false,
        }),
        className,
      )}
    >
      {LeadingIcon ? (
        <LeadingIcon className={cn(iconClass, 'shrink-0 text-muted-foreground')} aria-hidden="true" />
      ) : null}
      {prefix ? <span className="shrink-0 text-sm text-muted-foreground">{prefix}</span> : null}

      <input
        ref={setRefs}
        type={effectiveType}
        disabled={disabled}
        aria-invalid={invalid ? true : ariaInvalid}
        onChange={handleChange}
        className="w-full min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        {...(isControlled ? { value } : { defaultValue })}
        {...props}
      />

      {suffix ? <span className="shrink-0 text-sm text-muted-foreground">{suffix}</span> : null}

      {loading ? (
        <Loader2
          className={cn(iconClass, 'shrink-0 animate-spin text-muted-foreground')}
          aria-hidden="true"
        />
      ) : (
        <>
          {showClear ? (
            <button type="button" aria-label="Clear" onClick={handleClear} className={adornmentButton}>
              <X className={iconClass} aria-hidden="true" />
            </button>
          ) : null}
          {isPassword ? (
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              disabled={disabled}
              onClick={() => setShowPassword((prev) => !prev)}
              className={adornmentButton}
            >
              {showPassword ? (
                <EyeOff className={iconClass} aria-hidden="true" />
              ) : (
                <Eye className={iconClass} aria-hidden="true" />
              )}
            </button>
          ) : null}
          {TrailingIcon ? (
            <TrailingIcon
              className={cn(iconClass, 'shrink-0 text-muted-foreground')}
              aria-hidden="true"
            />
          ) : null}
        </>
      )}
    </div>
  );
});
