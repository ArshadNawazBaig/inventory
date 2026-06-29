import type { Metadata } from 'next';
import { PosTerminal } from '@/features/pos/components/pos-terminal';

export const metadata: Metadata = { title: 'Point of Sale · StockFlow' };

export default function PosPage() {
  return <PosTerminal />;
}
