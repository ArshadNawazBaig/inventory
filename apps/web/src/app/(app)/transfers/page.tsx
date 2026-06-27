import type { Metadata } from 'next';
import { TransferList } from '@/features/transfers/components/transfer-list';

export const metadata: Metadata = { title: 'Transfers · StockFlow' };

export default function TransfersPage() {
  return <TransferList />;
}
