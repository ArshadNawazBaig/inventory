import type { Meta, StoryObj } from '@storybook/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from './chart';

const meta: Meta<typeof ChartContainer> = {
  title: 'Data/Chart',
  component: ChartContainer,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof ChartContainer>;

const monthly = [
  { month: 'Jan', revenue: 4200, orders: 240 },
  { month: 'Feb', revenue: 5100, orders: 290 },
  { month: 'Mar', revenue: 4800, orders: 270 },
  { month: 'Apr', revenue: 6200, orders: 360 },
  { month: 'May', revenue: 7100, orders: 410 },
  { month: 'Jun', revenue: 6800, orders: 390 },
];

const config: ChartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
  orders: { label: 'Orders', color: 'var(--chart-2)' },
};

export const Line_: Story = {
  name: 'Line',
  render: () => (
    <ChartContainer config={config} className="h-72 w-full" aria-label="Monthly revenue and orders">
      <LineChart data={monthly} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
        <Line dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  ),
};

export const Bar_: Story = {
  name: 'Bar',
  render: () => (
    <ChartContainer config={config} className="h-72 w-full" aria-label="Monthly revenue and orders">
      <BarChart data={monthly} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const Area_: Story = {
  name: 'Area',
  render: () => (
    <ChartContainer config={config} className="h-72 w-full" aria-label="Monthly revenue">
      <AreaChart data={monthly} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="revenue"
          stroke="var(--color-revenue)"
          fill="var(--color-revenue)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  ),
};

const distribution = [
  { name: 'in-stock', value: 540 },
  { name: 'low', value: 120 },
  { name: 'out', value: 40 },
];

const pieConfig: ChartConfig = {
  'in-stock': { label: 'In stock', color: 'var(--chart-1)' },
  low: { label: 'Low', color: 'var(--chart-3)' },
  out: { label: 'Out', color: 'var(--chart-4)' },
};

export const Pie_: Story = {
  name: 'Pie',
  render: () => (
    <ChartContainer config={pieConfig} className="h-72 w-full" aria-label="Stock distribution">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={50}>
          {distribution.map((entry) => (
            <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  ),
};
