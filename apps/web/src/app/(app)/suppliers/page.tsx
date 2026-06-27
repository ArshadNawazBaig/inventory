import type { Metadata } from 'next';
import { SupplierAdmin } from '@/features/parties/components/supplier-admin';

export const metadata: Metadata = { title: 'Suppliers · StockFlow' };

export default function SuppliersPage() {
  return <SupplierAdmin />;
}
