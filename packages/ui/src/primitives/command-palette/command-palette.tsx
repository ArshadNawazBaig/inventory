'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { LucideIcon } from '@stockflow/icons';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from './command';

export interface CommandAction {
  id: string;
  label: string;
  /** Section heading; actions sharing a group are rendered together. */
  group?: string;
  icon?: LucideIcon;
  /** Hint shown at the end of the row (e.g. "G P"). */
  shortcut?: string;
  /** Extra search terms (synonyms) folded into the item's searchable value. */
  keywords?: string[];
  onSelect: () => void;
  disabled?: boolean;
}

export interface CommandPaletteProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  actions: CommandAction[];
  placeholder?: string;
  emptyMessage?: ReactNode;
  /** Toggle on ⌘K / Ctrl+K. */
  hotkey?: boolean;
  /** Accessible name for the dialog (visually hidden). */
  title?: string;
}

/**
 * CommandPalette — a ⌘K command menu: a token-skin over `cmdk` hosted in our Dialog. Pass `actions`; it
 * groups them, fuzzy-filters, navigates by keyboard, and runs-and-closes. Spec:
 * docs/components/command-palette.md.
 */
export function CommandPalette({
  open: openProp,
  defaultOpen,
  onOpenChange,
  actions,
  placeholder = 'Type a command or search…',
  emptyMessage = 'No results found.',
  hotkey = true,
  title = 'Command palette',
}: CommandPaletteProps) {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const open = isControlled ? openProp : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(!openRef.current);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hotkey, setOpen]);

  // Group actions, preserving first-seen order.
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, CommandAction[]>();
    for (const action of actions) {
      const key = action.group ?? '';
      const bucket = map.get(key);
      if (bucket) bucket.push(action);
      else {
        map.set(key, [action]);
        order.push(key);
      }
    }
    return order.map((key) => ({ group: key, items: map.get(key) ?? [] }));
  }, [actions]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showClose={false} className="overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Search for a command, then press Enter to run it.
        </DialogDescription>
        <Command label={title}>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {groups.map(({ group, items }) => (
              <CommandGroup key={group || '_ungrouped'} {...(group ? { heading: group } : {})}>
                {items.map((action) => {
                  const Icon = action.icon;
                  return (
                    <CommandItem
                      key={action.id}
                      value={[action.label, ...(action.keywords ?? [])].join(' ')}
                      disabled={action.disabled ?? false}
                      onSelect={() => {
                        action.onSelect();
                        setOpen(false);
                      }}
                    >
                      {Icon ? <Icon aria-hidden="true" /> : null}
                      <span>{action.label}</span>
                      {action.shortcut ? <CommandShortcut>{action.shortcut}</CommandShortcut> : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
