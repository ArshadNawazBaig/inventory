'use client';

import { ProductIcon, WarehouseIcon, SettingsIcon } from '@stockflow/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { Tabs, TabsList, TabsTrigger, TabsContent } from '@stockflow/ui';

<Tabs defaultValue="overview">
  <TabsList aria-label="Product sections">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="stock">Stock</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
  <TabsContent value="stock">…</TabsContent>
</Tabs>`;

const PROPS: PropRow[] = [
  { name: '<Tabs> value / defaultValue / onValueChange', type: 'string / string / fn', description: 'Active tab — controlled or uncontrolled.' },
  { name: '<Tabs> activationMode', type: "'automatic' | 'manual'", default: "'automatic'", description: 'Arrow keys switch immediately, or require Enter/Space.' },
  { name: '<TabsList> variant', type: "'line' | 'pill'", default: "'line'", description: 'Underlined rail or segmented control; inherited by triggers.' },
  { name: '<TabsTrigger> value / disabled', type: 'string / boolean', description: 'Tab id; disable an individual tab.' },
  { name: '<TabsContent> value', type: 'string', description: 'Matches a trigger; inactive panels unmount by default.' },
];

const panelClass = 'rounded-lg border border-border bg-card p-4 text-sm text-card-foreground';

export default function TabsShowcase() {
  return (
    <ShowcasePage
      title="Tabs"
      description="Switch between related panels within one context. Radix-backed (roving focus, arrow-key navigation), token-skinned in two styles. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Section title="Line (default) — primary underline">
        <Tabs defaultValue="overview" className="w-full max-w-md">
          <TabsList aria-label="Product sections (line)">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className={panelClass}>
            Product details and attributes.
          </TabsContent>
          <TabsContent value="stock" className={panelClass}>
            On-hand quantities by location.
          </TabsContent>
          <TabsContent value="history" className={panelClass}>
            The immutable stock ledger.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Pill — segmented control">
        <Tabs defaultValue="overview" className="w-full max-w-md">
          <TabsList variant="pill" aria-label="Product sections (pill)">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className={panelClass}>
            Product details and attributes.
          </TabsContent>
          <TabsContent value="stock" className={panelClass}>
            On-hand quantities by location.
          </TabsContent>
          <TabsContent value="history" className={panelClass}>
            The immutable stock ledger.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="With icons">
        <Tabs defaultValue="products" className="w-full max-w-md">
          <TabsList aria-label="Settings sections">
            <TabsTrigger value="products">
              <ProductIcon aria-hidden="true" />
              Products
            </TabsTrigger>
            <TabsTrigger value="warehouses">
              <WarehouseIcon aria-hidden="true" />
              Warehouses
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon aria-hidden="true" />
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="products" className={panelClass}>
            Manage products.
          </TabsContent>
          <TabsContent value="warehouses" className={panelClass}>
            Manage warehouses.
          </TabsContent>
          <TabsContent value="settings" className={panelClass}>
            Manage settings.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Disabled tab">
        <Tabs defaultValue="overview" className="w-full max-w-md">
          <TabsList aria-label="Sections with a disabled tab">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stock" disabled>
              Stock
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className={panelClass}>
            Overview panel.
          </TabsContent>
          <TabsContent value="history" className={panelClass}>
            History panel.
          </TabsContent>
        </Tabs>
      </Section>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Always label the rail (<code className="font-mono">aria-label</code> on{' '}
              <code className="font-mono">TabsList</code>); each{' '}
              <code className="font-mono">TabsContent</code> matches a trigger by{' '}
              <code className="font-mono">value</code>.
            </>,
            <>
              Pick a style with <code className="font-mono">variant</code> — <strong>line</strong> for
              page-level sections, <strong>pill</strong> for compact, in-card switches.
            </>,
            <>
              Default activation is <strong>automatic</strong> (arrow keys switch); use{' '}
              <code className="font-mono">activationMode=&quot;manual&quot;</code> when switching is
              expensive (e.g. each panel fetches).
            </>,
            'Use tabs for peer views of the same entity — not for steps in a flow (use a stepper) or navigation between pages (use links).',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
