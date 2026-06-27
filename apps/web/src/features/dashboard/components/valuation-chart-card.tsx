'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@stockflow/ui';
import type { WarehouseValuation } from '@stockflow/types';
import { toValuationChartData } from '@/features/reports/lib/valuation';

const chartConfig: ChartConfig = { value: { label: 'Value', color: 'var(--chart-1)' } };

/** Compact "value by warehouse" bar chart for the overview — reuses the Reports chart-data mapper. */
export function ValuationChartCard({ byWarehouse }: { byWarehouse: WarehouseValuation[] }) {
  const chartData = toValuationChartData(byWarehouse);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Value by warehouse</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No stock on hand yet.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full" aria-label="Stock value by warehouse">
            <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={56} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
