import type { Metadata } from 'next';
import { LocationAdmin } from '@/features/locations/components/location-admin';

export const metadata: Metadata = { title: 'Locations · StockFlow' };

export default function LocationsPage() {
  return <LocationAdmin />;
}
