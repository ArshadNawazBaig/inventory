'use client';

import { useMemo, useRef, useState } from 'react';
import { Badge, Search } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { Search } from '@stockflow/ui';

const [query, setQuery] = useState('');

<Search
  shortcut="/"
  placeholder="Search products…"
  onSearch={setQuery}   // debounced — wire to your query
/>`;

const PROPS: PropRow[] = [
  { name: 'value / defaultValue', type: 'string', description: 'Controlled / uncontrolled value.' },
  { name: 'onSearch', type: '(value: string) => void', description: 'Debounced; fires on Enter/clear too. Wire to your query.' },
  { name: 'onValueChange', type: '(value: string) => void', description: 'Immediate, every keystroke.' },
  { name: 'debounce', type: 'number', default: '300', description: 'Debounce for onSearch, in ms (0 = immediate).' },
  { name: 'shortcut', type: 'string', description: "Single key (e.g. '/') to focus the field; shows a kbd hint." },
  { name: 'loading', type: 'boolean', default: 'false', description: 'Trailing spinner while the query runs.' },
  { name: 'inputSize / variant', type: "'sm'|'md'|'lg' / 'default'|'filled'|'ghost'", default: "'md' / 'default'", description: 'Inherited from Input.' },
];

const SKUS = [
  'Widget A-100',
  'Widget B-200',
  'Gadget C-300',
  'Gizmo D-400',
  'Bolt E-500',
  'Bracket F-600',
  'Clamp G-700',
  'Hinge H-800',
];

export default function SearchShowcase() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useMemo(
    () => SKUS.filter((s) => s.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  // Simulate a brief in-flight state to show the loading spinner.
  const onSearch = (value: string) => {
    setSearching(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setQuery(value);
      setSearching(false);
    }, 400);
  };

  return (
    <ShowcasePage
      title="Search"
      description="A debounced, clearable search field composed from Input — magnifier icon, Enter to search, Escape to clear, an optional focus shortcut, and a loading spinner. Press / to focus the live demo. Toggle dark mode from the navbar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Live filter (debounced, shortcut “/”, simulated loading)">
        <Search
          shortcut="/"
          loading={searching}
          placeholder="Filter SKUs…"
          onSearch={onSearch}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge appearance="soft" tone="neutral" size="sm">
            {results.length}
          </Badge>
          result{results.length === 1 ? '' : 's'}
          {query ? (
            <>
              {' '}
              for “<span className="font-medium text-foreground">{query}</span>”
            </>
          ) : null}
        </div>
        <ul className="max-w-sm space-y-1 text-sm">
          {results.map((s) => (
            <li key={s} className="rounded-md border border-border px-3 py-2">
              {s}
            </li>
          ))}
          {results.length === 0 ? (
            <li className="rounded-md border border-dashed border-border px-3 py-2 text-muted-foreground">
              No matches
            </li>
          ) : null}
        </ul>
      </Block>

      <Section title="Sizes & variants">
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Search inputSize="sm" placeholder="Small" />
          <Search inputSize="md" placeholder="Medium" />
          <Search inputSize="lg" placeholder="Large" />
          <Search variant="filled" placeholder="Filled" />
          <Search defaultValue="in flight" loading placeholder="Loading" />
        </div>
      </Section>

      <Section title="Props">
        <PropsTable rows={PROPS} />
      </Section>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Wire <code className="font-mono">onSearch</code> (debounced) to your query — not{' '}
              <code className="font-mono">onValueChange</code> — so you don’t fire a request per keystroke.
            </>,
            <>
              Show <code className="font-mono">loading</code> while the request is in flight; the clear ✕ and
              Escape reset the query.
            </>,
            <>
              Add a <code className="font-mono">shortcut</code> (like <code className="font-mono">/</code>)
              for keyboard users; it’s ignored while typing in other fields.
            </>,
            'For multi-criteria filtering use Filters; for global navigation/actions use the Command Palette.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
