import type { Metadata } from 'next';
import { TransferDetail } from '@/features/transfers/components/transfer-detail';

export const metadata: Metadata = { title: 'Transfer · StockFlow' };

export default async function TransferPage({
  params,
}: {
  params: Promise<{ transferId: string }>;
}) {
  const { transferId } = await params;
  return <TransferDetail id={transferId} />;
}
