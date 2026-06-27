import type { Metadata } from 'next';
import { SalesOrderDetail } from '@/features/sales/components/sales-order-detail';

export const metadata: Metadata = { title: 'Sales order · StockFlow' };

export default async function SalesOrderPage({
  params,
}: {
  params: Promise<{ salesOrderId: string }>;
}) {
  const { salesOrderId } = await params;
  return <SalesOrderDetail id={salesOrderId} />;
}
