'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Field,
  FieldControl,
  Input,
  Modal,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@stockflow/ui';
import type { PurchaseOrderResponse } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { useActiveLocations } from '@/features/locations/queries';
import { useReceivePurchaseOrder } from '../mutations';

export interface ReceiveDialogProps {
  order: PurchaseOrderResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Receive outstanding quantities of a PO into a chosen location (posts `receipt` movements). */
export function ReceiveDialog({ order, open, onOpenChange }: ReceiveDialogProps) {
  const receive = useReceivePurchaseOrder();
  const locations = useActiveLocations(order.warehouseId);
  const outstanding = useMemo(
    () => order.lines.filter((line) => line.orderedQty - line.receivedQty > 0),
    [order.lines],
  );

  const [locationId, setLocationId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setLocationId('');
      setQuantities(
        Object.fromEntries(outstanding.map((line) => [line.id, String(line.orderedQty - line.receivedQty)])),
      );
    }
  }, [open, outstanding]);

  async function submit() {
    if (!locationId) {
      toast.error('Choose a location to receive into.');
      return;
    }
    const lines: { lineId: string; quantity: number }[] = [];
    for (const line of outstanding) {
      const quantity = Number(quantities[line.id] ?? '0');
      const max = line.orderedQty - line.receivedQty;
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
      await receive.mutateAsync({ id: order.id, body: { locationId, lines } });
      toast.success('Stock received');
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const locationItems = locations.data?.data ?? [];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={`Receive ${order.poNumber}`}
      description="Post received quantities into a location. This adds stock via the ledger."
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
      <div className="flex flex-col gap-5">
        <Field label="Receive into location" required>
          <Select value={locationId} onValueChange={setLocationId} disabled={locations.isLoading}>
            <FieldControl>
              <SelectTrigger placeholder={locations.isLoading ? 'Loading…' : 'Select a location'} />
            </FieldControl>
            <SelectContent>
              {locationItems.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.path} — {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Receive</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outstanding.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-xs">{line.skuSnapshot}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.orderedQty - line.receivedQty}
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
      </div>
    </Modal>
  );
}
