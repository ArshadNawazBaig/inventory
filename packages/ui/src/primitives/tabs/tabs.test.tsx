import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

function BasicTabs({ defaultValue = 'overview' }: { defaultValue?: string }) {
  return (
    <Tabs defaultValue={defaultValue}>
      <TabsList aria-label="Product sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="stock">Stock</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="stock">Stock panel</TabsContent>
      <TabsContent value="history">History panel</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('renders a labelled tablist with tabs', () => {
    render(<BasicTabs />);
    expect(screen.getByRole('tablist', { name: 'Product sections' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('shows the default panel and hides the others', () => {
    render(<BasicTabs />);
    expect(screen.getByText('Overview panel')).toBeVisible();
    expect(screen.queryByText('Stock panel')).not.toBeInTheDocument();
  });

  it('marks the active tab with aria-selected', () => {
    render(<BasicTabs />);
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Stock' })).toHaveAttribute('aria-selected', 'false');
  });

  it('switches panels when another tab is clicked', async () => {
    render(<BasicTabs />);
    await userEvent.click(screen.getByRole('tab', { name: 'Stock' }));
    expect(screen.getByText('Stock panel')).toBeVisible();
    expect(screen.queryByText('Overview panel')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Stock' })).toHaveAttribute('aria-selected', 'true');
  });

  it('moves selection with arrow keys (automatic activation)', async () => {
    render(<BasicTabs />);
    await userEvent.click(screen.getByRole('tab', { name: 'Overview' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Stock' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Stock panel')).toBeVisible();
  });

  it('reflects the inherited variant on triggers', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList variant="pill" aria-label="Pill set">
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
      </Tabs>,
    );
    // pill triggers raise onto a background surface when active.
    expect(screen.getByRole('tab', { name: 'A' }).className).toContain('data-[state=active]:bg-background');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicTabs />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
