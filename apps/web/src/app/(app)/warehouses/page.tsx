import type { Metadata } from 'next';
import { WarehouseAdmin } from '@/features/locations/components/warehouse-admin';

export const metadata: Metadata = { title: 'Warehouses · StockFlow' };

export default function WarehousesPage() {
  return <WarehouseAdmin />;
}
