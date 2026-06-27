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
import { ErrorState } from '@/components/errors';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { useTransfer } from '../queries';
import { useCancelTransfer, useDispatchTransfer } from '../mutations';
import { ReceiveDialog } from './receive-dialog';

export function TransferDetail({ id }: { id: string }) {
  const { data: transfer, isLoading, isError, error, refetch } = useTransfer(id);
  const dispatch = useDispatchTransfer();
  const cancel = useCancelTransfer();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [confirmDispatch, setConfirmDispatch] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return <Skeleton variant="rounded" className="h-64 w-full" />;
  }
  if (isError || !transfer) {
    return (
      <ErrorState
        title="Couldn’t load this transfer"
        description={errorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  const canDispatch = transfer.status === 'draft';
  const canReceive = transfer.status === 'in_transit' || transfer.status === 'partially_received';
  const canCancel = transfer.status === 'draft';

  async function runDispatch() {
    try {
      await dispatch.mutateAsync(transfer!.id);
      toast.success('Transfer dispatched');
      setConfirmDispatch(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function runCancel() {
    try {
      await cancel.mutateAsync(transfer!.id);
      toast.success('Transfer cancelled');
      setConfirmCancel(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/transfers" className="text-sm text-muted-foreground hover:underline">
          ← Transfers
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{transfer.transferNumber}</h1>
            <OrderStatusBadge status={transfer.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {transfer.sourceLocationName ?? 'Unknown source'} → {transfer.destinationLocationName ?? 'Unknown destination'}
          </p>
        </div>
        <div className="flex gap-2">
          {canDispatch ? (
            <Button onClick={() => setConfirmDispatch(true)}>Dispatch</Button>
          ) : null}
          {canReceive ? <Button onClick={() => setReceiveOpen(true)}>Receive</Button> : null}
          {canCancel ? (
            <Button variant="outline" onClick={() => setConfirmCancel(true)}>
              Cancel transfer
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
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Dispatched</TableHead>
              <TableHead className="text-right">Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfer.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-mono text-xs">{line.skuSnapshot}</TableCell>
                <TableCell>{line.nameSnapshot}</TableCell>
                <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                <TableCell className="text-right tabular-nums">{line.dispatchedQty}</TableCell>
                <TableCell className="text-right tabular-nums">{line.receivedQty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {transfer.note ? <p className="text-sm text-muted-foreground">{transfer.note}</p> : null}

      <ReceiveDialog transfer={transfer} open={receiveOpen} onOpenChange={setReceiveOpen} />
      <ConfirmDialog
        open={confirmDispatch}
        onOpenChange={setConfirmDispatch}
        title="Dispatch this transfer?"
        description="Stock leaves the source location now (posted to the ledger). Receive it at the destination when it arrives."
        confirmLabel="Dispatch"
        loading={dispatch.isPending}
        onConfirm={runDispatch}
      />
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this transfer?"
        description="It will be marked cancelled. This can't be undone."
        confirmLabel="Cancel transfer"
        variant="destructive"
        loading={cancel.isPending}
        onConfirm={runCancel}
      />
    </div>
  );
}
