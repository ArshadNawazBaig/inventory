import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Line, LineChart } from 'recharts';
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
  type ChartConfig,
} from './chart';

const config: ChartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
  orders: { label: 'Orders', color: 'var(--chart-2)' },
};

describe('ChartContainer', () => {
  it('injects --color-<key> variables from the config and tags the chart', () => {
    const { container } = render(
      <ChartContainer config={config} aria-label="Revenue chart">
        <LineChart data={[]}>
          <Line dataKey="revenue" />
        </LineChart>
      </ChartContainer>,
    );
    const root = container.querySelector('[data-chart]') as HTMLElement;
    expect(root).toBeInTheDocument();
    expect(root.getAttribute('style')).toContain('--color-revenue: var(--chart-1)');
    expect(root.getAttribute('style')).toContain('--color-orders: var(--chart-2)');
  });
});

describe('ChartTooltipContent', () => {
  it('renders the label, series names, and values when active', () => {
    render(
      <ChartTooltipContent
        active
        label="January"
        payload={[
          { name: 'Revenue', value: 1200, dataKey: 'revenue', color: '#6366f1' },
          { name: 'Orders', value: 34, dataKey: 'orders', color: '#14b8a6' },
        ]}
      />,
    );
    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('34')).toBeInTheDocument();
  });

  it('renders nothing when inactive', () => {
    const { container } = render(
      <ChartTooltipContent active={false} payload={[{ name: 'Revenue', value: 1 }]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing with an empty payload', () => {
    const { container } = render(<ChartTooltipContent active payload={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('can hide the label', () => {
    render(
      <ChartTooltipContent active hideLabel label="January" payload={[{ name: 'Revenue', value: 5 }]} />,
    );
    expect(screen.queryByText('January')).not.toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });
});

describe('ChartLegendContent', () => {
  it('renders an entry per series', () => {
    render(
      <ChartLegendContent
        payload={[
          { value: 'Revenue', dataKey: 'revenue', color: '#6366f1' },
          { value: 'Orders', dataKey: 'orders', color: '#14b8a6' },
        ]}
      />,
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ChartTooltipContent
        active
        label="January"
        payload={[{ name: 'Revenue', value: 1200, dataKey: 'revenue', color: '#6366f1' }]}
      />,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
