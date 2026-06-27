import type { Metadata } from 'next';
import { ReturnDetail } from '@/features/returns/components/return-detail';

export const metadata: Metadata = { title: 'Return · StockFlow' };

export default async function ReturnPage({
  params,
}: {
  params: Promise<{ returnId: string }>;
}) {
  const { returnId } = await params;
  return <ReturnDetail id={returnId} />;
}
