'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';
import { textareaVariants } from './textarea.variants';

export type TextareaVariant = 'default' | 'filled' | 'ghost';
export type TextareaSize = 'sm' | 'md' | 'lg';
export type TextareaResize = 'none' | 'vertical' | 'both';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Visual treatment (mirrors Input). */
  variant?: TextareaVariant;
  /** Font/padding/min-height (named to stay consistent with Input). */
  inputSize?: TextareaSize;
  /** Error state — applies error styling and sets `aria-invalid`. */
  invalid?: boolean;
  /** Grow the box with content between `minRows` and `maxRows`. Forces `resize="none"`. */
  autoResize?: boolean;
  /** Auto-resize floor (also the default `rows`). */
  minRows?: number;
  /** Auto-resize ceiling; past it the box scrolls. */
  maxRows?: number;
  /** Manual resize handle. Ignored (forced `none`) when `autoResize` is set. */
  resize?: TextareaResize;
}

const resizeClass: Record<TextareaResize, string> = {
  none: 'resize-none',
  vertical: 'resize-y',
  both: 'resize',
};

// Client component, but Next still renders it on the server — avoid the useLayoutEffect SSR warning.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Parse a computed pixel value, treating non-numeric (e.g. `''`, `'normal'`) as 0. */
function px(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Textarea — a bare multi-line control. Labels, descriptions, the character counter, and error
 * messages live in `Field` (compose them for accessible forms). Spec: docs/components/textarea.md.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    className,
    variant,
    inputSize = 'md',
    invalid,
    autoResize = false,
    minRows = 3,
    maxRows = 8,
    resize = 'vertical',
    rows,
    disabled,
    value,
    defaultValue,
    onChange,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const resizeToContent = useCallback(() => {
    const el = innerRef.current;
    if (!el || !autoResize) return;

    const styles = window.getComputedStyle(el);
    const fontSize = px(styles.fontSize) || 16;
    const lineHeight = px(styles.lineHeight) || fontSize * 1.2;
    const paddingY = px(styles.paddingTop) + px(styles.paddingBottom);
    const borderY = px(styles.borderTopWidth) + px(styles.borderBottomWidth);
    const minHeight = minRows * lineHeight + paddingY + borderY;
    const maxHeight = maxRows * lineHeight + paddingY + borderY;

    // Reset so scrollHeight reflects content, not the previous height. scrollHeight includes
    // padding but not border (border-box), so add it back when sizing.
    el.style.height = 'auto';
    const contentHeight = el.scrollHeight + borderY;
    el.style.height = `${Math.min(Math.max(contentHeight, minHeight), maxHeight)}px`;
    el.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
  }, [autoResize, minRows, maxRows]);

  // Size on mount and whenever a controlled value changes.
  useIsomorphicLayoutEffect(() => {
    resizeToContent();
  }, [resizeToContent, value]);

  // Recompute when the element's width changes (wrapping changes content height).
  useEffect(() => {
    const el = innerRef.current;
    if (!el || !autoResize || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => resizeToContent());
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoResize, resizeToContent]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(event);
    if (autoResize) resizeToContent();
  };

  const effectiveResize: TextareaResize = autoResize ? 'none' : resize;

  return (
    <textarea
      ref={setRefs}
      rows={rows ?? minRows}
      disabled={disabled}
      aria-invalid={invalid ? true : ariaInvalid}
      onChange={handleChange}
      className={cn(
        textareaVariants({ variant, inputSize, invalid: invalid ?? false }),
        resizeClass[effectiveResize],
        className,
      )}
      {...(value !== undefined ? { value } : { defaultValue })}
      {...props}
    />
  );
});
