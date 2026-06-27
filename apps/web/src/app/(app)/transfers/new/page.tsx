import type { Metadata } from 'next';
import { TransferForm } from '@/features/transfers/components/transfer-form';

export const metadata: Metadata = { title: 'New transfer · StockFlow' };

export default function NewTransferPage() {
  return <TransferForm />;
}
