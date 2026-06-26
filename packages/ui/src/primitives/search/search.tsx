'use client';

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { SearchIcon } from '@stockflow/icons';
import { Input, type InputProps } from '../input';

export interface SearchProps
  extends Omit<
    InputProps,
    'leadingIcon' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'clearable' | 'onClear' | 'prefix'
  > {
  /** Controlled value. */
  value?: string;
  /** Initial value (uncontrolled). */
  defaultValue?: string;
  /** Fires on every keystroke (immediate). */
  onValueChange?: (value: string) => void;
  /** Fires debounced, and immediately on Enter / clear — wire this to your query. */
  onSearch?: (value: string) => void;
  /** Debounce for `onSearch`, in ms (0 = immediate). */
  debounce?: number;
  /** A single key (e.g. `'/'`) that focuses the field from anywhere; shows a kbd hint while empty. */
  shortcut?: string;
}

/**
 * Search — a debounced, clearable search field composed from Input. `onSearch` is debounced (and fires on
 * Enter/clear); `onValueChange` is immediate. An optional single-key `shortcut` focuses it. Spec:
 * docs/components/search.md.
 */
export const Search = forwardRef<HTMLInputElement, SearchProps>(function Search(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    onSearch,
    debounce = 300,
    shortcut,
    placeholder = 'Search…',
    loading = false,
    disabled = false,
    onKeyDown,
    onFocus,
    onBlur,
    'aria-label': ariaLabel = 'Search',
    ...rest
  },
  ref,
) {
  const isControlled = valueProp !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? '');
  const value = isControlled ? valueProp : internal;

  const [focused, setFocused] = useState(false);
  const innerRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setRefs = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Clean up any pending debounce on unmount.
  useEffect(() => clearTimer, []);

  const scheduleSearch = (next: string) => {
    clearTimer();
    if (debounce <= 0) {
      onSearch?.(next);
      return;
    }
    timerRef.current = setTimeout(() => onSearch?.(next), debounce);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
    scheduleSearch(next);
  };

  const clear = () => {
    if (!isControlled) setInternal('');
    clearTimer();
    onValueChange?.('');
    onSearch?.('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      clearTimer();
      onSearch?.(value);
    } else if (event.key === 'Escape' && value) {
      event.preventDefault();
      clear();
    }
    onKeyDown?.(event);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(event);
  };
  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(event);
  };

  // Single-key shortcut to focus the field (ignored while typing elsewhere).
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable === true;
      if (!typing && event.key === shortcut) {
        event.preventDefault();
        innerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcut]);

  const showHint = Boolean(shortcut) && !focused && !value && !loading && !disabled;

  return (
    <Input
      ref={setRefs}
      type="text"
      leadingIcon={SearchIcon}
      clearable
      loading={loading}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={value}
      onChange={handleChange}
      onClear={clear}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      suffix={
        showHint ? (
          <kbd className="pointer-events-none select-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
            {shortcut}
          </kbd>
        ) : undefined
      }
      {...rest}
    />
  );
});
