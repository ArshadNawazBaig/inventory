import type { Metadata } from 'next';
import { ReturnForm } from '@/features/returns/components/return-form';

export const metadata: Metadata = { title: 'New return · StockFlow' };

export default function NewReturnPage() {
  return <ReturnForm />;
}
