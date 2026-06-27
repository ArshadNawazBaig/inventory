'use client';

import { useState } from 'react';
import {
  AddIcon,
  Button,
  CommandPalette,
  DashboardIcon,
  ProductsIcon,
  SearchIcon,
  SettingsIcon,
  TransferIcon,
  WarehouseIcon,
  type CommandAction,
} from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { CommandPalette, type CommandAction } from '@stockflow/ui';

const actions: CommandAction[] = [
  { id: 'products', label: 'Go to Products', group: 'Navigation', icon: ProductsIcon, shortcut: 'G P', onSelect: () => router.push('/products') },
  { id: 'create', label: 'Create product', group: 'Actions', icon: AddIcon, onSelect: openCreate },
];

// Mount once near the app root — ⌘K / Ctrl+K toggles it.
<CommandPalette actions={actions} />`;

const PROPS: PropRow[] = [
  { name: 'actions', type: 'CommandAction[]', description: 'id, label, group?, icon?, shortcut?, keywords?, onSelect, disabled?' },
  { name: 'open / defaultOpen', type: 'boolean', description: 'Controlled / uncontrolled visibility.' },
  { name: 'onOpenChange', type: '(open: boolean) => void', description: 'Open-state change.' },
  { name: 'hotkey', type: 'boolean', default: 'true', description: 'Toggle on ⌘K / Ctrl+K.' },
  { name: 'placeholder', type: 'string', default: "'Type a command or search…'", description: 'Input placeholder.' },
  { name: 'emptyMessage', type: 'ReactNode', default: "'No results found.'", description: 'Shown when nothing matches.' },
];

export default function CommandPaletteShowcase() {
  const [open, setOpen] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const make = (id: string, label: string, group: string, icon: CommandAction['icon'], shortcut?: string, keywords?: string[]): CommandAction => ({
    id,
    label,
    group,
    icon,
    ...(shortcut ? { shortcut } : {}),
    ...(keywords ? { keywords } : {}),
    onSelect: () => setLastRun(label),
  });

  const actions: CommandAction[] = [
    make('dashboard', 'Go to Dashboard', 'Navigation', DashboardIcon, 'G D'),
    make('products', 'Go to Products', 'Navigation', ProductsIcon, 'G P'),
    make('warehouses', 'Go to Warehouses', 'Navigation', WarehouseIcon, undefined, ['locations']),
    make('transfers', 'Go to Transfers', 'Navigation', TransferIcon),
    make('create-product', 'Create product', 'Actions', AddIcon, 'C'),
    make('search', 'Search inventory', 'Actions', SearchIcon, undefined, ['find', 'lookup']),
    make('settings', 'Open settings', 'Actions', SettingsIcon),
  ];

  return (
    <ShowcasePage
      title="Command Palette"
      description="A ⌘K command menu — a token-skin over cmdk hosted in our Dialog. Fuzzy-filtered, grouped, fully keyboard-navigable. Press ⌘K / Ctrl+K (or the button) to open it. Toggle dark mode from the navbar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Live">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setOpen(true)}>Open palette</Button>
          <span className="text-sm text-muted-foreground">
            …or press{' '}
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
              ⌘K
            </kbd>{' '}
            /{' '}
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
              Ctrl K
            </kbd>
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Last run:{' '}
          <span className="font-medium text-foreground">{lastRun ?? 'nothing yet'}</span>
        </p>
        <CommandPalette open={open} onOpenChange={setOpen} actions={actions} />
      </Block>

      <Section title="Props">
        <PropsTable rows={PROPS} />
      </Section>

      <Block title="Guidelines">
        <Guidelines
          items={[
            'Mount one CommandPalette near the app root; let ⌘K toggle it everywhere.',
            'Group by area (Navigation, Actions, Settings) and keep labels action-oriented ("Create product").',
            <>
              Add <code className="font-mono">keywords</code> for synonyms (e.g. “locations” → Warehouses) so
              users find commands by intent.
            </>,
            'Use the palette for navigation and actions; use Search for content search and Filters for table criteria.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
