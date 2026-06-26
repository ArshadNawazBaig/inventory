import type { Meta, StoryObj } from '@storybook/react';
import { ProductIcon, WarehouseIcon, SettingsIcon } from '@stockflow/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Navigation/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Tabs>;

const panelClass = 'text-sm text-muted-foreground';

export const Line: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[28rem]">
      <TabsList aria-label="Product sections">
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
  ),
};

export const Pill: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[28rem]">
      <TabsList variant="pill" aria-label="Product sections">
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
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="products" className="w-[28rem]">
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
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[28rem]">
      <TabsList aria-label="Product sections">
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
  ),
};
