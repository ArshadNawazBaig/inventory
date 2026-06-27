import type { Metadata } from 'next';
import { PurchaseOrderList } from '@/features/purchasing/components/purchase-order-list';

export const metadata: Metadata = { title: 'Purchasing · StockFlow' };

export default function PurchasingPage() {
  return <PurchaseOrderList />;
}
