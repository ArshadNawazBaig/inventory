import type { Metadata } from 'next';
import { PurchaseOrderDetail } from '@/features/purchasing/components/purchase-order-detail';

export const metadata: Metadata = { title: 'Purchase order · StockFlow' };

export default async function PurchaseOrderPage({
  params,
}: {
  params: Promise<{ purchaseOrderId: string }>;
}) {
  const { purchaseOrderId } = await params;
  return <PurchaseOrderDetail id={purchaseOrderId} />;
}
