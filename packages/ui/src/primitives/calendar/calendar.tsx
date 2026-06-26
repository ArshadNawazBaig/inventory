'use client';

import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';

export type CalendarProps = ComponentProps<typeof DayPicker>;

const navButton = cn(
  // pointer-events-auto: the day-view nav is an absolute pass-through layer (see `nav` below); the
  // buttons themselves must still capture clicks so the month/year caption beneath stays clickable.
  'pointer-events-auto inline-flex size-7 items-center justify-center rounded-md border border-input bg-transparent text-foreground transition-colors',
  'hover:bg-accent hover:text-accent-foreground',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'disabled:pointer-events-none disabled:opacity-50',
);

const gridCell = cn(
  'inline-flex h-12 items-center justify-center rounded-md text-sm font-medium text-foreground transition-colors',
  'hover:bg-accent hover:text-accent-foreground',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'disabled:pointer-events-none disabled:text-muted-foreground disabled:opacity-50',
  'data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary',
);

const headerLabelButton = cn(
  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition-colors',
  'hover:bg-accent hover:text-accent-foreground',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
);

const YEAR_PAGE = 12;
/** Align a year down to the start of its 12-year page (e.g. 2026 → 2016). */
const alignYear = (y: number) => y - (((y % YEAR_PAGE) + YEAR_PAGE) % YEAR_PAGE);

const MONTHS_SHORT = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(2021, i, 1)),
);

/** Shared header for the year/month drill-down panels: prev · (clickable) label · next. */
function PanelHeader({
  label,
  onLabelClick,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
}: {
  label: ReactNode;
  onLabelClick?: () => void;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <button type="button" className={navButton} onClick={onPrev} disabled={prevDisabled} aria-label="Previous">
        <ChevronLeftIcon className="size-4" aria-hidden="true" />
      </button>
      {onLabelClick ? (
        <button type="button" className={headerLabelButton} onClick={onLabelClick}>
          {label}
          <ChevronDownIcon className="size-3.5 opacity-60" aria-hidden="true" />
        </button>
      ) : (
        <span className="text-sm font-medium">{label}</span>
      )}
      <button type="button" className={navButton} onClick={onNext} disabled={nextDisabled} aria-label="Next">
        <ChevronRightIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

const dayClassNames = {
  months: 'relative flex flex-col gap-4 sm:flex-row',
  month: 'flex w-full flex-col gap-4',
  month_caption: 'flex h-9 items-center justify-center px-9',
  caption_label: 'text-sm font-medium',
  // Pass-through layer so the centered month/year caption underneath is fully clickable; the
  // prev/next buttons re-enable pointer events themselves (navButton).
  nav: 'pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between',
  button_previous: navButton,
  button_next: navButton,
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: 'w-9 text-[0.8rem] font-normal text-muted-foreground',
  week: 'mt-2 flex w-full',
  // Modifier classes (selected/today/range_*) land on the day CELL in v10; reach the button via [&>button].
  day: 'size-9 p-0 text-center text-sm',
  day_button: cn(
    'inline-flex size-9 items-center justify-center rounded-md p-0 font-normal text-foreground transition-colors',
    'hover:bg-accent hover:text-accent-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  ),
  selected:
    '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary [&>button:hover]:text-primary-foreground',
  today: '[&>button]:border [&>button]:border-primary',
  outside: '[&>button]:text-muted-foreground/50',
  disabled: '[&>button]:pointer-events-none [&>button]:text-muted-foreground [&>button]:opacity-50',
  range_start: '[&>button]:rounded-r-none',
  range_end: '[&>button]:rounded-l-none',
  range_middle: '[&>button]:rounded-none [&>button]:!bg-accent [&>button]:!text-accent-foreground',
  hidden: 'invisible',
} as const;

/**
 * Calendar — a token-skinned date grid built on react-day-picker (single/multiple/range). The selected
 * day fills with the **primary** colour; today is ringed. The month/year header is a **drill-down**:
 * click it to pick a year, then a month, then back to days — no fiddly dropdowns. The foundation for
 * Date Picker. Spec: docs/components/calendar.md.
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  startMonth,
  endMonth,
  month: monthProp,
  onMonthChange,
  defaultMonth,
  components,
  ...props
}: CalendarProps) {
  const now = useMemo(() => new Date(), []);
  const resolvedStart = startMonth ?? new Date(now.getFullYear() - 100, 0);
  const resolvedEnd = endMonth ?? new Date(now.getFullYear() + 10, 11);
  const minYear = resolvedStart.getFullYear();
  const maxYear = resolvedEnd.getFullYear();

  const [internalMonth, setInternalMonth] = useState<Date>(monthProp ?? defaultMonth ?? now);
  const month = monthProp ?? internalMonth;
  const setMonth = (next: Date) => {
    if (monthProp == null) setInternalMonth(next);
    onMonthChange?.(next);
  };

  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [yearPageStart, setYearPageStart] = useState(() =>
    alignYear((monthProp ?? defaultMonth ?? now).getFullYear()),
  );

  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const openYears = () => {
    setYearPageStart(alignYear(year));
    setView('years');
  };

  /** Clamp a (year, month) to the navigable range. */
  const clamp = (y: number, m: number): Date => {
    const min = new Date(minYear, resolvedStart.getMonth(), 1);
    const max = new Date(maxYear, resolvedEnd.getMonth(), 1);
    const d = new Date(y, m, 1);
    if (d < min) return min;
    if (d > max) return max;
    return d;
  };

  // ── Years view ──────────────────────────────────────────────────────────
  if (view === 'years') {
    const years = Array.from({ length: YEAR_PAGE }, (_, i) => yearPageStart + i);
    return (
      <div className={cn('p-3', className)}>
        <div className="w-[252px] space-y-2">
          <PanelHeader
            label={`${years[0]} – ${years[years.length - 1]}`}
            onPrev={() => setYearPageStart((s) => s - YEAR_PAGE)}
            onNext={() => setYearPageStart((s) => s + YEAR_PAGE)}
            prevDisabled={yearPageStart <= minYear}
            nextDisabled={yearPageStart + YEAR_PAGE > maxYear}
          />
          <div className="grid grid-cols-3 gap-2">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                className={gridCell}
                data-active={y === year || undefined}
                aria-current={y === year ? 'date' : undefined}
                disabled={y < minYear || y > maxYear}
                onClick={() => {
                  setMonth(clamp(y, monthIndex));
                  setView('months');
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Months view ─────────────────────────────────────────────────────────
  if (view === 'months') {
    return (
      <div className={cn('p-3', className)}>
        <div className="w-[252px] space-y-2">
          <PanelHeader
            label={String(year)}
            onLabelClick={openYears}
            onPrev={() => setMonth(clamp(year - 1, monthIndex))}
            onNext={() => setMonth(clamp(year + 1, monthIndex))}
            prevDisabled={year <= minYear}
            nextDisabled={year >= maxYear}
          />
          <div className="grid grid-cols-3 gap-2">
            {MONTHS_SHORT.map((name, m) => {
              const disabled =
                (year === minYear && m < resolvedStart.getMonth()) ||
                (year === maxYear && m > resolvedEnd.getMonth());
              return (
                <button
                  key={name}
                  type="button"
                  className={gridCell}
                  data-active={m === monthIndex || undefined}
                  aria-current={m === monthIndex ? 'date' : undefined}
                  disabled={disabled}
                  onClick={() => {
                    setMonth(new Date(year, m, 1));
                    setView('days');
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Days view (react-day-picker) ────────────────────────────────────────
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      startMonth={resolvedStart}
      endMonth={resolvedEnd}
      className={cn('p-3', className)}
      classNames={{ ...dayClassNames, ...classNames }}
      {...props}
      month={month}
      onMonthChange={setMonth}
      captionLayout="label"
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          const Icon =
            orientation === 'left'
              ? ChevronLeftIcon
              : orientation === 'right'
                ? ChevronRightIcon
                : orientation === 'up'
                  ? ChevronUpIcon
                  : ChevronDownIcon;
          return <Icon className={cn('size-4', chevronClassName)} aria-hidden="true" />;
        },
        CaptionLabel: ({ children }) => (
          <button type="button" className={headerLabelButton} onClick={openYears}>
            {children}
            <ChevronDownIcon className="size-3.5 opacity-60" aria-hidden="true" />
          </button>
        ),
        ...components,
      }}
    />
  );
}
