import type { Metadata } from 'next';
import { BrandAdmin } from '@/features/lookups/components/brand-admin';

export const metadata: Metadata = { title: 'Brands · StockFlow' };

export default function BrandsPage() {
  return <BrandAdmin />;
}
