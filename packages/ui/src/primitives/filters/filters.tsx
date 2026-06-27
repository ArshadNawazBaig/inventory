'use client';

import { useState, type KeyboardEvent } from 'react';
import { AddIcon, Check, ChevronDownIcon, XIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { Input } from '../input';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { filterChipClasses, filterMenuItem } from './filters.variants';

export interface FilterOption {
  value: string;
  label: string;
}

export type FilterDef =
  | { id: string; label: string; type: 'select'; options: FilterOption[] }
  | { id: string; label: string; type: 'multiselect'; options: FilterOption[] }
  | { id: string; label: string; type: 'text'; placeholder?: string };

export type FilterValue = string | string[];
export type FilterValues = Record<string, FilterValue | undefined>;

export interface FiltersProps {
  /** Available filters. */
  filters: FilterDef[];
  /** Controlled active values, keyed by filter id. */
  value?: FilterValues;
  /** Initial values (uncontrolled). */
  defaultValue?: FilterValues;
  /** Fires with the next values record. */
  onChange?: (value: FilterValues) => void;
  addLabel?: string;
  clearLabel?: string;
  className?: string;
}

function isActive(value: FilterValue | undefined): boolean {
  if (value == null) return false;
  return Array.isArray(value) ? value.length > 0 : value !== '';
}

function displayValue(def: FilterDef, value: FilterValue | undefined): string | null {
  if (def.type === 'multiselect') {
    const arr = Array.isArray(value) ? value : [];
    if (arr.length === 0) return null;
    if (arr.length === 1) return def.options.find((o) => o.value === arr[0])?.label ?? arr[0] ?? null;
    return `${arr.length} selected`;
  }
  if (def.type === 'select') {
    if (typeof value !== 'string' || value === '') return null;
    return def.options.find((o) => o.value === value)?.label ?? value;
  }
  return typeof value === 'string' && value !== '' ? value : null;
}

/** The per-filter editor (used by both the add flow and chip editing). */
function FilterEditor({
  def,
  value,
  onSetValue,
  onClose,
}: {
  def: FilterDef;
  value: FilterValue | undefined;
  onSetValue: (value: FilterValue) => void;
  onClose: () => void;
}) {
  if (def.type === 'select') {
    return (
      <div className="flex flex-col">
        {def.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={filterMenuItem}
            onClick={() => {
              onSetValue(opt.value);
              onClose();
            }}
          >
            <span className="flex-1">{opt.label}</span>
            {value === opt.value ? <Check className="size-4" aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
    );
  }

  if (def.type === 'multiselect') {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-col">
        {def.options.map((opt) => {
          const checked = arr.includes(opt.value);
          return (
            <label key={opt.value} className={cn(filterMenuItem, 'cursor-pointer')}>
              <Checkbox
                size="sm"
                checked={checked}
                aria-label={opt.label}
                onCheckedChange={() =>
                  onSetValue(checked ? arr.filter((v) => v !== opt.value) : [...arr, opt.value])
                }
              />
              <span className="flex-1">{opt.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <Input
      inputSize="sm"
      autoFocus
      value={typeof value === 'string' ? value : ''}
      placeholder={def.placeholder ?? 'Type to filter…'}
      onChange={(event) => onSetValue(event.target.value)}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') onClose();
      }}
    />
  );
}

/** One active filter: a chip whose body opens its own editor Popover, with a ✕ to remove. */
function ActiveFilter({
  def,
  value,
  onSetValue,
  onRemove,
}: {
  def: FilterDef;
  value: FilterValue | undefined;
  onSetValue: (value: FilterValue) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const display = displayValue(def, value);
  return (
    <div className={filterChipClasses.wrapper}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={filterChipClasses.body}>
            <span className="text-muted-foreground">
              {def.label}
              {display != null ? ':' : ''}
            </span>
            {display != null ? <span className="font-medium text-foreground">{display}</span> : null}
            <ChevronDownIcon className="size-3.5 opacity-60" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-1">
          <FilterEditor def={def} value={value} onSetValue={onSetValue} onClose={() => setOpen(false)} />
        </PopoverContent>
      </Popover>
      <button
        type="button"
        aria-label={`Remove ${def.label} filter`}
        onClick={onRemove}
        className={filterChipClasses.remove}
      >
        <XIcon className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Filters — a data-driven filter bar: a removable, editable chip per active filter, a two-step "Add filter"
 * menu (choose → edit) for inactive filters, and "Clear all". Composes Popover/Checkbox/Input/Button. Spec:
 * docs/components/filters.md.
 */
export function Filters({
  filters,
  value: valueProp,
  defaultValue,
  onChange,
  addLabel = 'Add filter',
  clearLabel = 'Clear all',
  className,
}: FiltersProps) {
  const isControlled = valueProp !== undefined;
  const [internal, setInternal] = useState<FilterValues>(defaultValue ?? {});
  const value = isControlled ? valueProp : internal;

  const [addOpen, setAddOpen] = useState(false);
  const [picking, setPicking] = useState<FilterDef | null>(null);

  const commit = (next: FilterValues) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };
  const setFilterValue = (id: string, next: FilterValue) => commit({ ...value, [id]: next });
  const remove = (id: string) => {
    const next = { ...value };
    delete next[id];
    commit(next);
  };

  const activeFilters = filters.filter((f) => isActive(value[f.id]));
  const inactive = filters.filter((f) => !isActive(value[f.id]));
  const hasActive = activeFilters.length > 0;

  const closeAdd = () => {
    setAddOpen(false);
    setPicking(null);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {activeFilters.map((def) => (
        <ActiveFilter
          key={def.id}
          def={def}
          value={value[def.id]}
          onSetValue={(next) => setFilterValue(def.id, next)}
          onRemove={() => remove(def.id)}
        />
      ))}

      <Popover
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setPicking(null);
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" leadingIcon={AddIcon}>
            {addLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-1">
          {picking ? (
            <FilterEditor
              def={picking}
              value={value[picking.id]}
              onSetValue={(next) => setFilterValue(picking.id, next)}
              onClose={closeAdd}
            />
          ) : inactive.length > 0 ? (
            inactive.map((f) => (
              <button
                key={f.id}
                type="button"
                className={filterMenuItem}
                onClick={() => setPicking(f)}
              >
                {f.label}
              </button>
            ))
          ) : (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No more filters</p>
          )}
        </PopoverContent>
      </Popover>

      {hasActive ? (
        <Button variant="ghost" size="sm" onClick={() => commit({})}>
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}
