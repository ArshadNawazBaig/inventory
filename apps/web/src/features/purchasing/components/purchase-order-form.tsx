'use client';

import { useRouter } from 'next/navigation';
import { toast } from '@stockflow/ui';
import type { SupplierResponse } from '@stockflow/types';
import { SUPPLIERS } from '@/features/parties/descriptors';
import { OrderForm } from '@/features/orders/components/order-form';
import type { OrderFormValues } from '@/features/orders/lib/order-form';
import { useCreatePurchaseOrder } from '../mutations';
import { toCreatePurchaseOrder } from '../lib/forms';

/** Create-a-draft-PO page body — configures the shared OrderForm for purchasing. */
export function PurchaseOrderForm() {
  const router = useRouter();
  const create = useCreatePurchaseOrder();

  async function onSubmit(values: OrderFormValues) {
    const order = await create.mutateAsync(toCreatePurchaseOrder(values));
    toast.success(`Created ${order.poNumber}`);
    router.push(`/purchasing/${order.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New purchase order</h1>
        <p className="text-sm text-muted-foreground">Order stock from a supplier into a warehouse.</p>
      </header>
      <OrderForm<SupplierResponse>
        partyDescriptor={SUPPLIERS}
        partyLabel="Supplier"
        moneyLabel="Unit cost"
        showExpectedAt
        submitLabel="Create purchase order"
        onSubmit={onSubmit}
      />
    </div>
  );
}
