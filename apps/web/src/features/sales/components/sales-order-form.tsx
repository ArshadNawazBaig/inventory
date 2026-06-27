'use client';

import { useRouter } from 'next/navigation';
import { toast } from '@stockflow/ui';
import type { CustomerResponse } from '@stockflow/types';
import { CUSTOMERS } from '@/features/parties/descriptors';
import { OrderForm } from '@/features/orders/components/order-form';
import type { OrderFormValues } from '@/features/orders/lib/order-form';
import { useCreateSalesOrder } from '../mutations';
import { toCreateSalesOrder } from '../lib/forms';

/** Create-a-draft-SO page body — configures the shared OrderForm for sales. */
export function SalesOrderForm() {
  const router = useRouter();
  const create = useCreateSalesOrder();

  async function onSubmit(values: OrderFormValues) {
    const order = await create.mutateAsync(toCreateSalesOrder(values));
    toast.success(`Created ${order.soNumber}`);
    router.push(`/sales/${order.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New sales order</h1>
        <p className="text-sm text-muted-foreground">Sell stock to a customer from a warehouse.</p>
      </header>
      <OrderForm<CustomerResponse>
        partyDescriptor={CUSTOMERS}
        partyLabel="Customer"
        moneyLabel="Unit price"
        showExpectedAt={false}
        submitLabel="Create sales order"
        onSubmit={onSubmit}
      />
    </div>
  );
}
