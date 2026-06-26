'use client';

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
} from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, ShowcasePage, type PropRow } from '../_ui/showcase';

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

const USAGE = `import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@stockflow/ui';
import { LineChart, Line, XAxis, CartesianGrid } from 'recharts';

const config: ChartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
};

<ChartContainer config={config} className="h-72 w-full">
  <LineChart data={data}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="month" tickLine={false} axisLine={false} />
    <ChartTooltip content={<ChartTooltipContent />} />
    {/* series reference the injected --color-<key> var */}
    <Line dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
  </LineChart>
</ChartContainer>`;

const PROPS: PropRow[] = [
  { name: '<ChartContainer> config', type: 'ChartConfig', description: 'Maps each series key to { label, color }. Color → --color-<key> var.' },
  { name: '<ChartContainer> className', type: 'string', default: 'aspect-video', description: 'Set an explicit height (e.g. h-72) for responsive sizing.' },
  { name: '<ChartTooltip>', type: 'Recharts Tooltip', description: 'Use content={<ChartTooltipContent />}.' },
  { name: '<ChartTooltipContent> hideLabel / hideIndicator / indicator', type: 'boolean / boolean / dot|line', description: 'Token-styled tooltip body.' },
  { name: '<ChartLegend> / <ChartLegendContent>', type: 'Recharts Legend / content', description: 'Token-styled legend (labels from config).' },
];

export default function ChartsShowcase() {
  return (
    <ShowcasePage
      title="Charts"
      description="Recharts, bridged to the design tokens: ChartContainer injects --color-<key> variables from your config (mapped to the theme-aware --chart-N palette), so every chart themes itself in light and dark. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <div className="grid gap-8 lg:grid-cols-2">
        <Block title="Line">
          <ChartContainer config={config} className="h-72 w-full" aria-label="Monthly revenue and orders (line)">
            <LineChart data={monthly} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
              <Line dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </Block>

        <Block title="Bar">
          <ChartContainer config={config} className="h-72 w-full" aria-label="Monthly revenue and orders (bar)">
            <BarChart data={monthly} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
            </BarChart>
          </ChartContainer>
        </Block>

        <Block title="Area">
          <ChartContainer config={config} className="h-72 w-full" aria-label="Monthly revenue (area)">
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
        </Block>

        <Block title="Pie (stock distribution)">
          <ChartContainer config={pieConfig} className="h-72 w-full" aria-label="Stock distribution (pie)">
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
        </Block>
      </div>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Drive colour from <code className="font-mono">config</code> →{' '}
              <code className="font-mono">var(--color-&lt;key&gt;)</code>, mapped to the theme-aware{' '}
              <code className="font-mono">--chart-1…5</code> palette — never hard-code hex in series.
            </>,
            <>
              Give <code className="font-mono">ChartContainer</code> an explicit height (e.g.{' '}
              <code className="font-mono">h-72</code>) so the responsive container can size itself.
            </>,
            <>
              Charts are visual — add an <code className="font-mono">aria-label</code> describing the
              insight, and pair important data with an accessible table or summary.
            </>,
            'Keep series counts low and consistent; reuse the same key→colour mapping across related charts.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
