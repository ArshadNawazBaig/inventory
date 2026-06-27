'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@stockflow/ui';
import { errorMessage } from '@/lib/api';
import { formatMinorToMajor } from '@/lib/money';
import { ErrorState } from '@/components/errors';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { useSalesOrder } from '../queries';
import { useCancelSalesOrder, useConfirmSalesOrder } from '../mutations';
import { FulfillDialog } from './fulfill-dialog';

export function SalesOrderDetail({ id }: { id: string }) {
  const { data: order, isLoading, isError, error, refetch } = useSalesOrder(id);
  const confirm = useConfirmSalesOrder();
  const cancel = useCancelSalesOrder();
  const [fulfillOpen, setFulfillOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return <Skeleton variant="rounded" className="h-64 w-full" />;
  }
  if (isError || !order) {
    return (
      <ErrorState
        title="Couldn’t load this sales order"
        description={errorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  const canConfirm = order.status === 'draft';
  const canFulfill = order.status === 'confirmed' || order.status === 'partially_fulfilled';
  const canCancel = order.status === 'draft' || order.status === 'confirmed';

  async function runConfirm() {
    try {
      await confirm.mutateAsync(order!.id);
      toast.success('Sales order confirmed');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function runCancel() {
    try {
      await cancel.mutateAsync(order!.id);
      toast.success('Sales order cancelled');
      setConfirmCancel(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/sales" className="text-sm text-muted-foreground hover:underline">
          ← Sales orders
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{order.soNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {order.customerName ?? 'Unknown customer'} · {order.currency}
          </p>
        </div>
        <div className="flex gap-2">
          {canConfirm ? (
            <Button onClick={() => void runConfirm()} loading={confirm.isPending}>
              Confirm
            </Button>
          ) : null}
          {canFulfill ? <Button onClick={() => setFulfillOpen(true)}>Fulfil</Button> : null}
          {canCancel ? (
            <Button variant="outline" onClick={() => setConfirmCancel(true)}>
              Cancel order
            </Button>
          ) : null}
        </div>
      </header>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Ordered</TableHead>
              <TableHead className="text-right">Shipped</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-mono text-xs">{line.skuSnapshot}</TableCell>
                <TableCell>{line.nameSnapshot}</TableCell>
                <TableCell className="text-right tabular-nums">{line.orderedQty}</TableCell>
                <TableCell className="text-right tabular-nums">{line.shippedQty}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMinorToMajor(line.unitPriceMinor)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMinorToMajor(line.unitPriceMinor * line.orderedQty)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <div className="text-sm">
          <span className="text-muted-foreground">Total </span>
          <span className="font-semibold tabular-nums">
            {formatMinorToMajor(order.totals.totalMinor)} {order.currency}
          </span>
        </div>
      </div>

      <FulfillDialog order={order} open={fulfillOpen} onOpenChange={setFulfillOpen} />
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this sales order?"
        description="It will be marked cancelled. This can't be undone."
        confirmLabel="Cancel order"
        variant="destructive"
        loading={cancel.isPending}
        onConfirm={runCancel}
      />
    </div>
  );
}
