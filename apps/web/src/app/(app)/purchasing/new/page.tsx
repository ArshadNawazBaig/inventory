import type { Metadata } from 'next';
import { PurchaseOrderForm } from '@/features/purchasing/components/purchase-order-form';

export const metadata: Metadata = { title: 'New purchase order · StockFlow' };

export default function NewPurchaseOrderPage() {
  return <PurchaseOrderForm />;
}
