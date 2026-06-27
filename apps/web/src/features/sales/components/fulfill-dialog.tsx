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
import type { SalesOrderResponse } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { useActiveLocations } from '@/features/locations/queries';
import { useFulfillSalesOrder } from '../mutations';

export interface FulfillDialogProps {
  order: SalesOrderResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Fulfil outstanding quantities of an SO from a chosen location (posts `shipment` movements). */
export function FulfillDialog({ order, open, onOpenChange }: FulfillDialogProps) {
  const fulfill = useFulfillSalesOrder();
  const locations = useActiveLocations(order.warehouseId);
  const outstanding = useMemo(
    () => order.lines.filter((line) => line.orderedQty - line.shippedQty > 0),
    [order.lines],
  );

  const [locationId, setLocationId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setLocationId('');
      setQuantities(
        Object.fromEntries(outstanding.map((line) => [line.id, String(line.orderedQty - line.shippedQty)])),
      );
    }
  }, [open, outstanding]);

  async function submit() {
    if (!locationId) {
      toast.error('Choose a location to ship from.');
      return;
    }
    const lines: { lineId: string; quantity: number }[] = [];
    for (const line of outstanding) {
      const quantity = Number(quantities[line.id] ?? '0');
      const max = line.orderedQty - line.shippedQty;
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
      await fulfill.mutateAsync({ id: order.id, body: { locationId, lines } });
      toast.success('Stock shipped');
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
      title={`Fulfil ${order.soNumber}`}
      description="Ship quantities from a location. This removes stock via the ledger."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" loading={fulfill.isPending} loadingText="Shipping…" onClick={() => void submit()}>
            Fulfil
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Ship from location" required>
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
                <TableHead className="text-right">Ship</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outstanding.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-xs">{line.skuSnapshot}</TableCell>
                  <TableCell className="text-right tabular-nums">{line.orderedQty - line.shippedQty}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      inputMode="numeric"
                      className="w-24"
                      value={quantities[line.id] ?? ''}
                      onChange={(event) =>
                        setQuantities((prev) => ({ ...prev, [line.id]: event.target.value }))
                      }
                      aria-label={`Ship quantity for ${line.skuSnapshot}`}
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
