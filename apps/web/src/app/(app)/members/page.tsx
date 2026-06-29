import type { Metadata } from 'next';
import { MembersView } from '@/features/auth/components/members-view';

export const metadata: Metadata = { title: 'Members · StockFlow' };

export default function MembersPage() {
  return <MembersView />;
}
