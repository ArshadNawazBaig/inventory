import type { Metadata } from 'next';
import { AuditLogList } from '@/features/audit/components/audit-log-list';

export const metadata: Metadata = { title: 'Audit log · StockFlow' };

export default function AuditLogsPage() {
  return <AuditLogList />;
}
