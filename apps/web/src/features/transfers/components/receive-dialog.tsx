'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@stockflow/ui';
import type { TransferResponse } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { useReceiveTransfer } from '../mutations';

export interface ReceiveDialogProps {
  transfer: TransferResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Receive in-transit quantities of a transfer into its destination (posts `transfer_in` movements). */
export function ReceiveDialog({ transfer, open, onOpenChange }: ReceiveDialogProps) {
  const receive = useReceiveTransfer();
  const inTransit = useMemo(
    () => transfer.lines.filter((line) => line.dispatchedQty - line.receivedQty > 0),
    [transfer.lines],
  );

  const [quantities, setQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setQuantities(
        Object.fromEntries(inTransit.map((line) => [line.id, String(line.dispatchedQty - line.receivedQty)])),
      );
    }
  }, [open, inTransit]);

  async function submit() {
    const lines: { lineId: string; quantity: number }[] = [];
    for (const line of inTransit) {
      const quantity = Number(quantities[line.id] ?? '0');
      const max = line.dispatchedQty - line.receivedQty;
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > max) {
        toast.error(`Enter 0–${max} for ${line.skuSnapshot}.`);
        return;
      }
      if (quantity > 0) lines.push({ lineId: line.id, quantity });
    }
    if (lines.length === 0) {
      toast.error('Enter a quantity for at least one line.');
      return;
    }
    try {
      await receive.mutateAsync({ id: transfer.id, body: { lines } });
      toast.success('Stock received');
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={`Receive ${transfer.transferNumber}`}
      description={`Post arriving quantities into ${transfer.destinationLocationName ?? 'the destination'}. This adds stock via the ledger.`}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" loading={receive.isPending} loadingText="Receiving…" onClick={() => void submit()}>
            Receive
          </Button>
        </>
      }
    >
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">In transit</TableHead>
              <TableHead className="text-right">Receive</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inTransit.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-mono text-xs">{line.skuSnapshot}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {line.dispatchedQty - line.receivedQty}
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    inputMode="numeric"
                    className="w-24"
                    value={quantities[line.id] ?? ''}
                    onChange={(event) =>
                      setQuantities((prev) => ({ ...prev, [line.id]: event.target.value }))
                    }
                    aria-label={`Receive quantity for ${line.skuSnapshot}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Modal>
  );
}
