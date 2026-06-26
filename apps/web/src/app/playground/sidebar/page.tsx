'use client';

import { useState } from 'react';
import {
  DashboardIcon,
  ProductsIcon,
  WarehouseIcon,
  SupplierIcon,
  PurchaseOrderIcon,
  SettingsIcon,
} from '@stockflow/icons';
import {
  Avatar,
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
} from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, ShowcasePage, type PropRow } from '../_ui/showcase';

const NAV = [
  { slug: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { slug: 'products', label: 'Products', icon: ProductsIcon },
  { slug: 'warehouses', label: 'Warehouses', icon: WarehouseIcon },
  { slug: 'suppliers', label: 'Suppliers', icon: SupplierIcon },
  { slug: 'orders', label: 'Purchase Orders', icon: PurchaseOrderIcon },
];

const USAGE = `import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarTrigger,
} from '@stockflow/ui';

<SidebarProvider>
  <Sidebar aria-label="Main navigation">
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Inventory</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* real link + aria-current; provide icon + label as children */}
            <SidebarMenuButton asChild active tooltip="Products">
              <a href="/products" aria-current="page">
                <ProductsIcon /><span>Products</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <main>
    <SidebarTrigger />
    {/* page content */}
  </main>
</SidebarProvider>`;

const PROPS: PropRow[] = [
  { name: '<SidebarProvider> defaultCollapsed / collapsed / onCollapsedChange', type: 'boolean / boolean / fn', description: 'Uncontrolled or controlled collapse state.' },
  { name: '<Sidebar> side', type: "'left' | 'right'", default: "'left'", description: 'Which edge the rail sits on.' },
  { name: '<Sidebar> collapsible', type: "'icon' | 'none'", default: "'icon'", description: '"icon" collapses to a rail; "none" pins it open.' },
  { name: '<SidebarMenuButton> asChild / active / tooltip', type: 'boolean / boolean / string', description: 'Render as a link; mark current; tooltip when collapsed.' },
  { name: '<SidebarTrigger>', type: 'button', description: 'Toggles collapse (named "Toggle sidebar").' },
  { name: 'useSidebar()', type: '{ collapsed, toggle, setCollapsed }', description: 'Read/drive collapse from anywhere in the shell.' },
];

export default function SidebarShowcase() {
  const [activeSlug, setActiveSlug] = useState('dashboard');

  return (
    <ShowcasePage
      title="Sidebar"
      description="The app-shell navigation rail. Click the toggle (top-left of the demo) to collapse to an icon rail; hover a collapsed item for its tooltip. Toggle dark mode from the page sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Live demo">
        <div className="h-[460px] overflow-hidden rounded-xl border border-border">
          <SidebarProvider className="h-full min-h-0">
            <Sidebar aria-label="Demo navigation" className="h-full">
              <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-1">
                  <div className="size-7 shrink-0 rounded-md bg-primary" />
                  <span className="font-semibold group-data-[state=collapsed]/sidebar:sr-only">
                    StockFlow
                  </span>
                </div>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Inventory</SidebarGroupLabel>
                  <SidebarMenu>
                    {NAV.map((item) => (
                      <SidebarMenuItem key={item.slug}>
                        <SidebarMenuButton
                          asChild
                          active={activeSlug === item.slug}
                          tooltip={item.label}
                        >
                          <a
                            href={`#${item.slug}`}
                            aria-current={activeSlug === item.slug ? 'page' : undefined}
                            onClick={() => setActiveSlug(item.slug)}
                          >
                            <item.icon aria-hidden="true" />
                            <span className="truncate">{item.label}</span>
                          </a>
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
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Jane Doe">
                      <Avatar size="xs" name="Jane Doe" />
                      <span className="truncate">Jane Doe</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>
            <main className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <h2 className="text-lg font-semibold capitalize">{activeSlug}</h2>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Selected section: <span className="font-medium text-foreground">{activeSlug}</span>.
                Collapse the rail and hover the icons.
              </p>
            </main>
          </SidebarProvider>
        </div>
      </Block>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Provide the icon + label as <strong>children</strong> (e.g.{' '}
              <code className="font-mono">&lt;ProductIcon /&gt;&lt;span&gt;Products&lt;/span&gt;</code>);
              when collapsed the label is clipped but stays in the accessible name.
            </>,
            <>
              Use real links with <code className="font-mono">asChild</code> and set{' '}
              <code className="font-mono">aria-current=&quot;page&quot;</code> on the active route — colour
              isn’t the only cue.
            </>,
            <>
              Pass <code className="font-mono">tooltip</code> so collapsed icons get a hover label; give the{' '}
              <code className="font-mono">Sidebar</code> an <code className="font-mono">aria-label</code>{' '}
              (it’s a landmark).
            </>,
            'One sidebar per shell. Mobile off-canvas will come from a future Sheet component.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
