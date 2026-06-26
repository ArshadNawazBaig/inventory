import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { DashboardIcon, ProductIcon } from '@stockflow/icons';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './sidebar';

function Shell() {
  return (
    <SidebarProvider>
      <Sidebar aria-label="Main navigation">
        <SidebarHeader>StockFlow</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Inventory</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton active tooltip="Dashboard">
                  <DashboardIcon aria-hidden="true" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Products">
                  <a href="/products">
                    <ProductIcon aria-hidden="true" />
                    <span>Products</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarTrigger />
    </SidebarProvider>
  );
}

describe('Sidebar', () => {
  it('renders the nav as a complementary landmark with items', () => {
    render(<Shell />);
    expect(screen.getByRole('complementary', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument();
  });

  it('marks the active item with data-active', () => {
    render(<Shell />);
    expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute('data-active', 'true');
  });

  it('toggles the collapse state via the trigger', async () => {
    const user = userEvent.setup();
    render(<Shell />);
    const aside = screen.getByRole('complementary', { name: 'Main navigation' });
    expect(aside).toHaveAttribute('data-state', 'expanded');
    await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }));
    expect(aside).toHaveAttribute('data-state', 'collapsed');
  });

  it('renders nav rows as links via asChild', () => {
    render(<Shell />);
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Shell />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
