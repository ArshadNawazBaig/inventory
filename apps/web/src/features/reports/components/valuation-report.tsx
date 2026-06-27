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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type ChartConfig,
} from '@stockflow/ui';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { formatMinorToMajor } from '@/lib/money';
import { useInventoryValuation } from '../queries';
import { toValuationChartData } from '../lib/valuation';

const chartConfig: ChartConfig = { value: { label: 'Value', color: 'var(--chart-1)' } };

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export function ValuationReport() {
  const { data, isLoading, isError, error, refetch } = useInventoryValuation();

  if (isLoading) return <Skeleton variant="rounded" className="h-72 w-full" />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Couldn’t load the valuation report"
        description={errorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  const ccy = data.currency ?? '';
  const chartData = toValuationChartData(data.byWarehouse);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total stock value" value={`${formatMinorToMajor(data.totals.totalValueMinor)} ${ccy}`.trim()} />
        <Kpi label="Total units" value={data.totals.totalUnits.toLocaleString()} />
        <Kpi label="Variants in stock" value={data.totals.variantCount.toLocaleString()} />
        <Kpi label="Stock cells" value={data.totals.cellCount.toLocaleString()} />
      </div>

      {chartData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Value by warehouse</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full" aria-label="Stock value by warehouse">
              <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={56} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : null}

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.byWarehouse.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No stock on hand.
                </TableCell>
              </TableRow>
            ) : (
              data.byWarehouse.map((w) => (
                <TableRow key={w.warehouseId}>
                  <TableCell className="font-medium">{w.warehouseName ?? 'Unassigned'}</TableCell>
                  <TableCell className="text-right tabular-nums">{w.units.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMinorToMajor(w.valueMinor)} {ccy}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
