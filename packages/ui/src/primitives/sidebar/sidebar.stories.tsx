import type { Meta, StoryObj } from '@storybook/react';
import {
  DashboardIcon,
  ProductIcon,
  WarehouseIcon,
  SupplierIcon,
  SettingsIcon,
} from '@stockflow/icons';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './sidebar';

const meta: Meta<typeof Sidebar> = {
  title: 'Navigation/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Sidebar>;

const NAV = [
  { icon: DashboardIcon, label: 'Dashboard', active: true },
  { icon: ProductIcon, label: 'Products' },
  { icon: WarehouseIcon, label: 'Warehouses' },
  { icon: SupplierIcon, label: 'Suppliers' },
];

function Shell({ defaultCollapsed = false }: { defaultCollapsed?: boolean }) {
  return (
    <SidebarProvider defaultCollapsed={defaultCollapsed} className="h-svh">
      <Sidebar aria-label="Main navigation">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="size-7 shrink-0 rounded-md bg-primary" />
            <span className="font-semibold group-data-[state=collapsed]/sidebar:sr-only">StockFlow</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Inventory</SidebarGroupLabel>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton active={item.active} tooltip={item.label}>
                    <item.icon aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <SettingsIcon aria-hidden="true" />
                <span className="truncate">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 p-6">
        <SidebarTrigger />
        <h1 className="mt-4 text-xl font-semibold">Dashboard</h1>
      </main>
    </SidebarProvider>
  );
}

export const Default: Story = { render: () => <Shell /> };
export const Collapsed: Story = { render: () => <Shell defaultCollapsed /> };
