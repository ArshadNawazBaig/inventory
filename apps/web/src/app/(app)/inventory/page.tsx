import type { Metadata } from 'next';
import { InventoryBrowser } from '@/features/inventory/components/inventory-browser';

export const metadata: Metadata = { title: 'Inventory · StockFlow' };

export default function InventoryPage() {
  return <InventoryBrowser />;
}
