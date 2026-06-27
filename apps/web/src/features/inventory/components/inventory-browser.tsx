'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@stockflow/ui';
import { AddIcon } from '@stockflow/icons';
import type { StockLevelListQuery, StockMovementListQuery } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { useStockLevels, useStockMovements } from '../queries';
import { useLocationLabels } from '../hooks/use-location-labels';
import { formatDelta, formatMoney, MOVEMENT_TYPE_LABELS } from '../lib/format';
import { VariantPicker } from './variant-picker';
import { AdjustStockDialog } from './adjust-stock-dialog';

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

/** Inventory — pick a variant, view its on-hand projection and ledger history, and post adjustments. */
export function InventoryBrowser() {
  const [variantId, setVariantId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const locationLabel = useLocationLabels();
  const enabled = Boolean(variantId);

  const levelsQuery: StockLevelListQuery = { page: 1, limit: 50, sort: '-updatedAt', variantId };
  const movementsQuery: StockMovementListQuery = { page: 1, limit: 50, sort: '-createdAt', variantId };
  const levels = useStockLevels(levelsQuery, enabled);
  const movements = useStockMovements(movementsQuery, enabled);

  const levelRows = levels.data?.data ?? [];
  const movementRows = movements.data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            On-hand stock and the immutable movement ledger. Pick a variant to inspect its stock.
          </p>
        </div>
        <Button leadingIcon={AddIcon} onClick={() => setDialogOpen(true)}>
          Adjust stock
        </Button>
      </header>

      <div className="rounded-xl border border-border p-4">
        <VariantPicker value={variantId} onChange={setVariantId} />
      </div>

      {!enabled ? (
        <ErrorState
          title="Select a variant"
          description="Choose a product and variant above to view its stock levels and movement history."
        />
      ) : (
        <Tabs defaultValue="levels">
          <TabsList>
            <TabsTrigger value="levels">Stock levels</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
          </TabsList>

          <TabsContent value="levels">
            {levels.isError ? (
              <ErrorState
                title="Couldn’t load stock levels"
                description={errorMessage(levels.error)}
                onRetry={() => void levels.refetch()}
              />
            ) : (
              <div className="rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">On hand</TableHead>
                      <TableHead className="text-right">Reserved</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Avg cost</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levels.isLoading ? (
                      Array.from({ length: 3 }, (_, row) => (
                        <TableRow key={`level-skeleton-${row}`}>
                          {Array.from({ length: 6 }, (_, cell) => (
                            <TableCell key={cell}>
                              <Skeleton variant="text" className="max-w-[120px]" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : levelRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No stock yet for this variant.
                        </TableCell>
                      </TableRow>
                    ) : (
                      levelRows.map((level) => (
                        <TableRow key={`${level.variantId}:${level.locationId}`}>
                          <TableCell className="font-medium">{locationLabel(level.locationId)}</TableCell>
                          <TableCell className="text-right tabular-nums">{level.onHand}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {level.reserved}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{level.available}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatMoney(level.avgCostMinor, level.currency)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(level.updatedAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="movements">
            {movements.isError ? (
              <ErrorState
                title="Couldn’t load movements"
                description={errorMessage(movements.error)}
                onRetry={() => void movements.refetch()}
              />
            ) : (
              <div className="rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.isLoading ? (
                      Array.from({ length: 3 }, (_, row) => (
                        <TableRow key={`move-skeleton-${row}`}>
                          {Array.from({ length: 5 }, (_, cell) => (
                            <TableCell key={cell}>
                              <Skeleton variant="text" className="max-w-[120px]" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : movementRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No movements recorded for this variant.
                        </TableCell>
                      </TableRow>
                    ) : (
                      movementRows.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="text-muted-foreground">{formatDate(movement.createdAt)}</TableCell>
                          <TableCell>
                            <Badge tone="neutral">{MOVEMENT_TYPE_LABELS[movement.type]}</Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium tabular-nums ${
                              movement.delta > 0 ? 'text-success' : 'text-destructive'
                            }`}
                          >
                            {formatDelta(movement.delta)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{locationLabel(movement.locationId)}</TableCell>
                          <TableCell className="text-muted-foreground">{movement.note ?? '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <AdjustStockDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
