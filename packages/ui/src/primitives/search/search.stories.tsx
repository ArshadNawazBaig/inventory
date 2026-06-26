import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Search } from './search';

const meta: Meta<typeof Search> = {
  title: 'Search/Search',
  component: Search,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Search>;

export const Basic: Story = {
  render: () => <Search className="max-w-sm" onSearch={(v) => console.log('search:', v)} />,
};

export const WithShortcut: Story = {
  render: () => <Search className="max-w-sm" shortcut="/" placeholder="Search products…" />,
};

export const Loading: Story = {
  render: () => <Search className="max-w-sm" defaultValue="widget" loading />,
};

export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-3">
      <Search inputSize="sm" placeholder="Small" />
      <Search inputSize="md" placeholder="Medium" />
      <Search inputSize="lg" placeholder="Large" />
    </div>
  ),
};

const SKUS = ['Widget A-100', 'Widget B-200', 'Gadget C-300', 'Gizmo D-400', 'Bolt E-500'];

export const LiveFilter: Story = {
  render: function LiveFilterStory() {
    const [query, setQuery] = useState('');
    const results = useMemo(
      () => SKUS.filter((s) => s.toLowerCase().includes(query.toLowerCase())),
      [query],
    );
    return (
      <div className="max-w-sm space-y-3">
        <Search shortcut="/" onSearch={setQuery} placeholder="Filter SKUs…" />
        <ul className="space-y-1 text-sm">
          {results.map((s) => (
            <li key={s} className="rounded-md border border-border px-3 py-2">
              {s}
            </li>
          ))}
          {results.length === 0 ? <li className="text-muted-foreground">No matches</li> : null}
        </ul>
      </div>
    );
  },
};
