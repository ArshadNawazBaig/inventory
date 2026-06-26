'use client';

import { useState, type ReactNode } from 'react';
import { format as formatDate } from 'date-fns';
import { CalendarIcon, XIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { inputVariants } from '../input/input.variants';
import type { InputVariant, InputSize } from '../input/input';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/popover';
import { Calendar } from '../calendar/calendar';
import type { DateRange, Matcher } from 'react-day-picker';

/** Props shared by both modes — the field skin, constraints, and popover placement. */
export interface DatePickerBaseProps {
  /** Text shown when nothing is selected. Defaults are mode-aware. */
  placeholder?: string;
  /** `date-fns` format pattern for the displayed value. Default `'PP'` (localized medium date). */
  dateFormat?: string;
  /** Disable the whole field (trigger won't open). */
  disabled?: boolean;
  /** Error state — error skin + `aria-invalid` on the trigger. */
  invalid?: boolean;
  /** Field treatment — matches Input/Select. */
  variant?: InputVariant;
  /** Field height/padding/font — matches Input/Select. */
  inputSize?: InputSize;
  /** Show a clear (✕) button when a value is set. */
  clearable?: boolean;
  /** Disable days in the calendar (e.g. `{ before: today }`, weekends). */
  disabledDays?: Matcher | Matcher[];
  /** Bound the navigable range / drill-down. */
  startMonth?: Date;
  endMonth?: Date;
  /** Popover alignment relative to the trigger. */
  align?: 'start' | 'center' | 'end';
  /** Width/layout overrides on the field wrapper. */
  className?: string;
  /** Associates with a `<label htmlFor>`. */
  id?: string;
  /** Name for native form posts (single mode renders a hidden `yyyy-MM-dd` input). */
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export interface DatePickerSingleProps extends DatePickerBaseProps {
  mode?: 'single';
  // `| undefined` is explicit so a `Date | undefined` controlled value type-checks under
  // exactOptionalPropertyTypes (otherwise the single branch is rejected and TS falls through to range).
  value?: Date | undefined;
  defaultValue?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
}

export interface DatePickerRangeProps extends DatePickerBaseProps {
  mode: 'range';
  value?: DateRange | undefined;
  defaultValue?: DateRange | undefined;
  onChange?: (range: DateRange | undefined) => void;
  /** Months shown side by side. Default 2. */
  numberOfMonths?: number;
}

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;

/** Constraint props common to both calendars, conditionally spread for `exactOptionalPropertyTypes`. */
function calendarConstraints(props: DatePickerBaseProps) {
  return {
    ...(props.disabledDays !== undefined ? { disabled: props.disabledDays } : {}),
    ...(props.startMonth !== undefined ? { startMonth: props.startMonth } : {}),
    ...(props.endMonth !== undefined ? { endMonth: props.endMonth } : {}),
  };
}

interface DatePickerShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Formatted value or placeholder. */
  display: ReactNode;
  /** True when no value is set (mutes the label, hides clear). */
  empty: boolean;
  clearable: boolean;
  onClear: () => void;
  disabled: boolean;
  invalid: boolean;
  variant: DatePickerBaseProps['variant'];
  inputSize: NonNullable<DatePickerBaseProps['inputSize']>;
  align: NonNullable<DatePickerBaseProps['align']>;
  className: string | undefined;
  id: string | undefined;
  ariaLabel: string | undefined;
  ariaLabelledby: string | undefined;
  /** Accessible name for the popover dialog (Radix sets role="dialog"). */
  contentLabel: string;
  /** Optional hidden form input(s). */
  hiddenInput?: ReactNode;
  /** The Calendar panel. */
  children: ReactNode;
}

/** Shared chrome: the token field trigger + popover-hosted calendar + optional clear/hidden input. */
function DatePickerShell({
  open,
  onOpenChange,
  display,
  empty,
  clearable,
  onClear,
  disabled,
  invalid,
  variant,
  inputSize,
  align,
  className,
  id,
  ariaLabel,
  ariaLabelledby,
  contentLabel,
  hiddenInput,
  children,
}: DatePickerShellProps) {
  const showClear = clearable && !empty && !disabled;
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <div className={cn('relative w-full', className)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            data-empty={empty || undefined}
            className={cn(
              inputVariants({ variant, inputSize, invalid, disabled }),
              'w-full justify-start text-left font-normal',
              'data-[empty=true]:text-muted-foreground',
              showClear && 'pr-9',
            )}
          >
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1 truncate">{display}</span>
          </button>
        </PopoverTrigger>
        {showClear ? (
          <button
            type="button"
            aria-label="Clear date"
            onClick={onClear}
            className={cn(
              'absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm',
              'text-muted-foreground transition-colors hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        ) : null}
        {hiddenInput}
      </div>
      <PopoverContent align={align} aria-label={contentLabel} className="w-auto p-0">
        {children}
      </PopoverContent>
    </Popover>
  );
}

function SingleDatePicker(props: DatePickerSingleProps) {
  const {
    value,
    defaultValue,
    onChange,
    placeholder = 'Pick a date',
    dateFormat = 'PP',
    disabled = false,
    invalid = false,
    variant,
    inputSize = 'md',
    clearable = false,
    align = 'start',
    className,
    id,
    name,
  } = props;

  const [open, setOpen] = useState(false);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<Date | undefined>(defaultValue);
  const selected = isControlled ? value : internal;

  const commit = (next: Date | undefined) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  return (
    <DatePickerShell
      open={open}
      onOpenChange={setOpen}
      display={selected ? formatDate(selected, dateFormat) : placeholder}
      empty={!selected}
      clearable={clearable}
      onClear={() => commit(undefined)}
      disabled={disabled}
      invalid={invalid}
      variant={variant}
      inputSize={inputSize}
      align={align}
      className={className}
      id={id}
      ariaLabel={props['aria-label']}
      ariaLabelledby={props['aria-labelledby']}
      contentLabel="Choose a date"
      hiddenInput={
        name ? (
          <input type="hidden" name={name} value={selected ? formatDate(selected, 'yyyy-MM-dd') : ''} />
        ) : null
      }
    >
      <Calendar
        mode="single"
        onSelect={(date: Date | undefined) => {
          commit(date);
          setOpen(false);
        }}
        {...(selected ? { selected, defaultMonth: selected } : {})}
        {...calendarConstraints(props)}
      />
    </DatePickerShell>
  );
}

function RangeDatePicker(props: DatePickerRangeProps) {
  const {
    value,
    defaultValue,
    onChange,
    placeholder = 'Pick a date range',
    dateFormat = 'PP',
    disabled = false,
    invalid = false,
    variant,
    inputSize = 'md',
    clearable = false,
    align = 'start',
    className,
    id,
    numberOfMonths = 2,
  } = props;

  const [open, setOpen] = useState(false);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<DateRange | undefined>(defaultValue);
  const selected = isControlled ? value : internal;

  const commit = (next: DateRange | undefined) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const display = !selected?.from
    ? placeholder
    : selected.to
      ? `${formatDate(selected.from, dateFormat)} – ${formatDate(selected.to, dateFormat)}`
      : formatDate(selected.from, dateFormat);

  return (
    <DatePickerShell
      open={open}
      onOpenChange={setOpen}
      display={display}
      empty={!selected?.from}
      clearable={clearable}
      onClear={() => commit(undefined)}
      disabled={disabled}
      invalid={invalid}
      variant={variant}
      inputSize={inputSize}
      align={align}
      className={className}
      id={id}
      ariaLabel={props['aria-label']}
      ariaLabelledby={props['aria-labelledby']}
      contentLabel="Choose a date range"
    >
      <Calendar
        mode="range"
        numberOfMonths={numberOfMonths}
        onSelect={(range: DateRange | undefined) => {
          commit(range);
          if (range?.from && range.to) setOpen(false);
        }}
        {...(selected?.from ? { selected, defaultMonth: selected.from } : {})}
        {...calendarConstraints(props)}
      />
    </DatePickerShell>
  );
}

/**
 * DatePicker — a compact, accessible date field: a token-skinned trigger (matching Input) that opens the
 * Calendar in a Popover. `mode="single"` yields a `Date`; `mode="range"` a `DateRange`. Controlled or
 * uncontrolled; clearable; constrain with `disabledDays`. Spec: docs/components/date-picker.md.
 */
export function DatePicker(props: DatePickerProps) {
  return props.mode === 'range' ? (
    <RangeDatePicker {...props} />
  ) : (
    <SingleDatePicker {...props} />
  );
}
