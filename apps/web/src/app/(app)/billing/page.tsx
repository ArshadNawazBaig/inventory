import type { Metadata } from 'next';
import { BillingView } from '@/features/billing/components/billing-view';

export const metadata: Metadata = { title: 'Billing · StockFlow' };

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground">Your plan, usage, and subscription.</p>
      </header>
      <BillingView />
    </div>
  );
}
