import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Filters, type FilterDef, type FilterValues } from './filters';
import { FilterChip } from './filter-chip';

const meta: Meta<typeof Filters> = {
  title: 'Search/Filters',
  component: Filters,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Filters>;

const FILTERS: FilterDef[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
      { value: 'draft', label: 'Draft' },
    ],
  },
  {
    id: 'warehouse',
    label: 'Warehouse',
    type: 'multiselect',
    options: [
      { value: 'a', label: 'Warehouse A' },
      { value: 'b', label: 'Warehouse B' },
      { value: 'c', label: 'Warehouse C' },
    ],
  },
  { id: 'sku', label: 'SKU', type: 'text', placeholder: 'Contains…' },
];

export const Empty: Story = {
  render: function EmptyStory() {
    const [value, setValue] = useState<FilterValues>({});
    return <Filters filters={FILTERS} value={value} onChange={setValue} />;
  },
};

export const WithActiveFilters: Story = {
  render: function ActiveStory() {
    const [value, setValue] = useState<FilterValues>({ status: 'active', warehouse: ['a', 'b'] });
    return (
      <div className="space-y-4">
        <Filters filters={FILTERS} value={value} onChange={setValue} />
        <pre className="rounded-md bg-muted p-3 text-xs">{JSON.stringify(value, null, 2)}</pre>
      </div>
    );
  },
};

export const StandaloneChips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <FilterChip label="Status" value="Active" onRemove={() => {}} />
      <FilterChip label="Warehouse" value="2 selected" onClick={() => {}} onRemove={() => {}} />
      <FilterChip label="Archived" onRemove={() => {}} />
    </div>
  ),
};
