import type { Metadata } from 'next';
import { SalesOrderForm } from '@/features/sales/components/sales-order-form';

export const metadata: Metadata = { title: 'New sales order · StockFlow' };

export default function NewSalesOrderPage() {
  return <SalesOrderForm />;
}
