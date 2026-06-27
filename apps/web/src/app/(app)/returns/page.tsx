import type { Metadata } from 'next';
import { ReturnList } from '@/features/returns/components/return-list';

export const metadata: Metadata = { title: 'Returns · StockFlow' };

export default function ReturnsPage() {
  return <ReturnList />;
}
