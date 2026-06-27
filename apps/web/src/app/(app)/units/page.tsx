import type { Metadata } from 'next';
import { UnitAdmin } from '@/features/lookups/components/unit-admin';

export const metadata: Metadata = { title: 'Units · StockFlow' };

export default function UnitsPage() {
  return <UnitAdmin />;
}
