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
import { usePurchaseOrder } from '../queries';
import { useCancelPurchaseOrder, useSubmitPurchaseOrder } from '../mutations';
import { ReceiveDialog } from './receive-dialog';

export function PurchaseOrderDetail({ id }: { id: string }) {
  const { data: order, isLoading, isError, error, refetch } = usePurchaseOrder(id);
  const submit = useSubmitPurchaseOrder();
  const cancel = useCancelPurchaseOrder();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return <Skeleton variant="rounded" className="h-64 w-full" />;
  }
  if (isError || !order) {
    return (
      <ErrorState
        title="Couldn’t load this purchase order"
        description={errorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  const canSubmit = order.status === 'draft';
  const canReceive = order.status === 'submitted' || order.status === 'partially_received';
  const canCancel = order.status === 'draft' || order.status === 'submitted';

  async function runSubmit() {
    try {
      await submit.mutateAsync(order!.id);
      toast.success('Purchase order submitted');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function runCancel() {
    try {
      await cancel.mutateAsync(order!.id);
      toast.success('Purchase order cancelled');
      setConfirmCancel(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/purchasing" className="text-sm text-muted-foreground hover:underline">
          ← Purchase orders
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{order.poNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {order.supplierName ?? 'Unknown supplier'} · {order.currency}
            {order.expectedAt ? ` · expected ${order.expectedAt}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {canSubmit ? (
            <Button onClick={() => void runSubmit()} loading={submit.isPending}>
              Submit
            </Button>
          ) : null}
          {canReceive ? <Button onClick={() => setReceiveOpen(true)}>Receive</Button> : null}
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
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Unit cost</TableHead>
              <TableHead className="text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-mono text-xs">{line.skuSnapshot}</TableCell>
                <TableCell>{line.nameSnapshot}</TableCell>
                <TableCell className="text-right tabular-nums">{line.orderedQty}</TableCell>
                <TableCell className="text-right tabular-nums">{line.receivedQty}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMinorToMajor(line.unitCostMinor)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMinorToMajor(line.unitCostMinor * line.orderedQty)}
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

      <ReceiveDialog order={order} open={receiveOpen} onOpenChange={setReceiveOpen} />
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this purchase order?"
        description="It will be marked cancelled. This can't be undone."
        confirmLabel="Cancel order"
        variant="destructive"
        loading={cancel.isPending}
        onConfirm={runCancel}
      />
    </div>
  );
}
