'use client';

import { useMemo, useState } from 'react';
import { Badge, FilterChip, Filters, type FilterDef, type FilterValues } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { Filters, type FilterDef, type FilterValues } from '@stockflow/ui';

const FILTERS: FilterDef[] = [
  { id: 'status', label: 'Status', type: 'select', options: [...] },
  { id: 'warehouse', label: 'Warehouse', type: 'multiselect', options: [...] },
  { id: 'sku', label: 'SKU', type: 'text' },
];

const [value, setValue] = useState<FilterValues>({});
<Filters filters={FILTERS} value={value} onChange={setValue} />`;

const PROPS: PropRow[] = [
  { name: 'filters', type: 'FilterDef[]', description: 'select | multiselect | text definitions.' },
  { name: 'value / defaultValue', type: 'FilterValues', description: 'Active values keyed by id ({ [id]: string | string[] }).' },
  { name: 'onChange', type: '(value: FilterValues) => void', description: 'Next values after add/edit/remove/clear.' },
  { name: 'addLabel / clearLabel', type: 'string', default: "'Add filter' / 'Clear all'", description: 'Button labels.' },
];

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

const PRODUCTS = [
  { sku: 'A-100', name: 'Widget', status: 'active', warehouse: 'a' },
  { sku: 'B-200', name: 'Gadget', status: 'active', warehouse: 'b' },
  { sku: 'C-300', name: 'Gizmo', status: 'archived', warehouse: 'a' },
  { sku: 'D-400', name: 'Bracket', status: 'draft', warehouse: 'c' },
  { sku: 'E-500', name: 'Bolt', status: 'active', warehouse: 'c' },
  { sku: 'F-600', name: 'Clamp', status: 'archived', warehouse: 'b' },
];

const STATUS_LABEL: Record<string, string> = { active: 'Active', archived: 'Archived', draft: 'Draft' };
const WAREHOUSE_LABEL: Record<string, string> = { a: 'A', b: 'B', c: 'C' };

export default function FiltersShowcase() {
  const [value, setValue] = useState<FilterValues>({ status: 'active' });

  const rows = useMemo(() => {
    const status = typeof value.status === 'string' ? value.status : undefined;
    const warehouse = Array.isArray(value.warehouse) ? value.warehouse : [];
    const sku = typeof value.sku === 'string' ? value.sku.toLowerCase() : '';
    return PRODUCTS.filter(
      (p) =>
        (!status || p.status === status) &&
        (warehouse.length === 0 || warehouse.includes(p.warehouse)) &&
        (!sku || p.sku.toLowerCase().includes(sku) || p.name.toLowerCase().includes(sku)),
    );
  }, [value]);

  return (
    <ShowcasePage
      title="Filters"
      description="A data-driven filter bar for tables: removable, editable chips per active filter, an add menu of inactive filters, and clear all. Wire the value to your query/columns. Toggle dark mode from the navbar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Live (filtering a product table)">
        <Filters filters={FILTERS} value={value} onChange={setValue} />

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Warehouse</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.sku} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">
                    <Badge
                      appearance="soft"
                      size="sm"
                      tone={p.status === 'active' ? 'success' : p.status === 'archived' ? 'neutral' : 'warning'}
                    >
                      {STATUS_LABEL[p.status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">Warehouse {WAREHOUSE_LABEL[p.warehouse]}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    No products match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          {rows.length} of {PRODUCTS.length} products
        </p>
      </Block>

      <Section title="Standalone chips">
        <FilterChip label="Status" value="Active" onRemove={() => {}} />
        <FilterChip label="Warehouse" value="2 selected" onClick={() => {}} onRemove={() => {}} />
        <FilterChip label="Archived" onRemove={() => {}} />
      </Section>

      <Section title="Props">
        <PropsTable rows={PROPS} />
      </Section>

      <Block title="Guidelines">
        <Guidelines
          items={[
            'Keep the value controlled alongside your table/query state; map it to TanStack column filters or an API request.',
            <>
              Use a <code className="font-mono">text</code> filter for contains-search of one field; use the
              separate <strong>Search</strong> component for global search.
            </>,
            'Don’t overload the bar — expose the common filters and group rarely-used ones; pair with DataGrid.',
            'Each chip is editable (click) and removable (✕); “Clear all” resets everything.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
