import type { Metadata } from 'next';
import { CustomerAdmin } from '@/features/parties/components/customer-admin';

export const metadata: Metadata = { title: 'Customers · StockFlow' };

export default function CustomersPage() {
  return <CustomerAdmin />;
}
