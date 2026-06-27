'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  toast,
} from '@stockflow/ui';
import { errorMessage } from '@/lib/api';
import { ErrorState } from '@/components/errors';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { useReturn } from '../queries';
import { useCancelReturn, useCompleteReturn } from '../mutations';

export function ReturnDetail({ id }: { id: string }) {
  const { data: ret, isLoading, isError, error, refetch } = useReturn(id);
  const complete = useCompleteReturn();
  const cancel = useCancelReturn();
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return <Skeleton variant="rounded" className="h-64 w-full" />;
  }
  if (isError || !ret) {
    return (
      <ErrorState
        title="Couldn’t load this return"
        description={errorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  const canComplete = ret.status === 'draft';
  const canCancel = ret.status === 'draft';
  const isCustomer = ret.kind === 'customer';

  async function runComplete() {
    try {
      await complete.mutateAsync(ret!.id);
      toast.success('Return completed');
      setConfirmComplete(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function runCancel() {
    try {
      await cancel.mutateAsync(ret!.id);
      toast.success('Return cancelled');
      setConfirmCancel(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/returns" className="text-sm text-muted-foreground hover:underline">
          ← Returns
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{ret.returnNumber}</h1>
            <Badge tone={isCustomer ? 'info' : 'neutral'}>{isCustomer ? 'Customer' : 'Supplier'}</Badge>
            <OrderStatusBadge status={ret.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {ret.partyName ?? 'Unknown party'}
            {ret.reason ? ` · ${ret.reason}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {canComplete ? (
            <Button onClick={() => setConfirmComplete(true)}>Complete</Button>
          ) : null}
          {canCancel ? (
            <Button variant="outline" onClick={() => setConfirmCancel(true)}>
              Cancel return
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {ret.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-mono text-xs">{line.skuSnapshot}</TableCell>
                <TableCell>{line.nameSnapshot}</TableCell>
                <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {ret.note ? <p className="text-sm text-muted-foreground">{ret.note}</p> : null}

      <ConfirmDialog
        open={confirmComplete}
        onOpenChange={setConfirmComplete}
        title="Complete this return?"
        description={
          isCustomer
            ? 'Returned stock will be added back at the chosen location (posted to the ledger).'
            : 'Stock will be removed from the chosen location and sent back to the supplier (posted to the ledger).'
        }
        confirmLabel="Complete return"
        loading={complete.isPending}
        onConfirm={runComplete}
      />
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this return?"
        description="It will be marked cancelled. This can't be undone."
        confirmLabel="Cancel return"
        variant="destructive"
        loading={cancel.isPending}
        onConfirm={runCancel}
      />
    </div>
  );
}
