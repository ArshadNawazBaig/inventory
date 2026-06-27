import type { Metadata } from 'next';
import { SalesOrderList } from '@/features/sales/components/sales-order-list';

export const metadata: Metadata = { title: 'Sales · StockFlow' };

export default function SalesPage() {
  return <SalesOrderList />;
}
