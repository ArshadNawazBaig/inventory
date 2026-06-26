'use client';

import { useState } from 'react';
import {
  Badge,
  Checkbox,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  type BadgeTone,
} from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

interface Row {
  sku: string;
  name: string;
  status: 'in-stock' | 'low' | 'out';
  onHand: number;
}

const ROWS: Row[] = [
  { sku: 'SF-001', name: 'Wireless Mouse', status: 'in-stock', onHand: 128 },
  { sku: 'SF-002', name: 'Mechanical Keyboard', status: 'low', onHand: 9 },
  { sku: 'SF-003', name: 'USB-C Hub', status: 'out', onHand: 0 },
  { sku: 'SF-004', name: '27" Monitor', status: 'in-stock', onHand: 42 },
];

const TONE: Record<Row['status'], { tone: BadgeTone; label: string }> = {
  'in-stock': { tone: 'success', label: 'In stock' },
  low: { tone: 'warning', label: 'Low' },
  out: { tone: 'danger', label: 'Out' },
};

const USAGE = `import {
  Table, TableHeader, TableBody, TableFooter,
  TableRow, TableHead, TableCell, TableCaption,
} from '@stockflow/ui';

<Table>
  <TableCaption>Inventory snapshot</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>SKU</TableHead>
      <TableHead className="text-right">On hand</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">SF-001</TableCell>
      <TableCell className="text-right tabular-nums">128</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

const PROPS: PropRow[] = [
  { name: '<Table> wrapperClassName', type: 'string', description: 'Class for the scroll wrapper (e.g. a max-height for a sticky header).' },
  { name: '<TableHeader> / <TableBody> / <TableFooter>', type: 'thead / tbody / tfoot', description: 'Row groups; footer is styled for totals.' },
  { name: '<TableRow> data-state', type: '"selected"', description: 'Highlights the row (accent background).' },
  { name: '<TableHead> scope', type: "'col' | 'row'", default: "'col'", description: 'Header cell; defaults to a column header.' },
  { name: '<TableCell>', type: 'td', description: 'Data cell. Add text-right tabular-nums for numeric columns.' },
  { name: '<TableCaption>', type: 'caption', description: 'Names the table for assistive tech.' },
];

export default function TableShowcase() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['SF-001']));
  const allSelected = selected.size === ROWS.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(ROWS.map((r) => r.sku)));
  const toggleOne = (sku: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });

  return (
    <ShowcasePage
      title="Table"
      description="Semantic, token-skinned table primitives — the presentational layer. Compose with TanStack Table for sorting/selection/pagination (that smart component is DataGrid). Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Live demo — selectable inventory table">
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">On hand</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((row) => {
                const isSelected = selected.has(row.sku);
                return (
                  <TableRow key={row.sku} data-state={isSelected ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(row.sku)}
                        aria-label={`Select ${row.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{row.sku}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      <Badge tone={TONE[row.status].tone} dot>
                        {TONE[row.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.onHand}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>
                  {selected.size} of {ROWS.length} selected
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {ROWS.reduce((sum, r) => sum + r.onHand, 0)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Block>

      <Section title="Sticky header (scrolls within a max-height)">
        <div className="w-full max-w-xl rounded-xl border border-border">
          <Table
            wrapperClassName="max-h-64"
            className="[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:bg-background"
          >
            <TableCaption className="sr-only">Scrollable items</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">On hand</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 20 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    SF-{String(i + 1).padStart(3, '0')}
                  </TableCell>
                  <TableCell>Item {i + 1}</TableCell>
                  <TableCell className="text-right tabular-nums">{(i + 1) * 7}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              These are <strong>presentational primitives</strong> — no sorting/selection logic. For a
              smart grid, compose them with TanStack Table (shipping next as{' '}
              <strong>DataGrid</strong>).
            </>,
            <>
              Right-align numeric columns and add <code className="font-mono">tabular-nums</code> so
              digits line up; keep them in the <code className="font-mono">.tabular-nums</code> token.
            </>,
            <>
              Give every table a <code className="font-mono">TableCaption</code> (use{' '}
              <code className="font-mono">sr-only</code> if a visible heading already names it); header
              cells default to <code className="font-mono">scope=&quot;col&quot;</code>.
            </>,
            <>
              Mark selected rows with <code className="font-mono">data-state=&quot;selected&quot;</code>;
              pair the row checkbox with an <code className="font-mono">aria-label</code>.
            </>,
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
