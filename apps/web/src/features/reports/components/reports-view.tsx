'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@stockflow/ui';
import { ValuationReport } from './valuation-report';
import { LowStockReport } from './low-stock-report';

/** Reports landing — inventory valuation + the low-stock (reorder) report, as tabs. */
export function ReportsView() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Inventory valuation and what needs reordering.</p>
      </header>

      <Tabs defaultValue="valuation">
        <TabsList>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="low-stock">Low stock</TabsTrigger>
        </TabsList>
        <TabsContent value="valuation" className="pt-6">
          <ValuationReport />
        </TabsContent>
        <TabsContent value="low-stock" className="pt-6">
          <LowStockReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
