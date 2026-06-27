'use client';

import { Badge, Button, Modal } from '@stockflow/ui';
import type { AuditLogResponse } from '@stockflow/types';
import { formatActorType, humanizeAction } from '../lib/audit-format';

export interface AuditLogDetailDialogProps {
  entry: AuditLogResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm text-foreground break-words">{children}</dd>
    </div>
  );
}

/** Read-only detail of one audit entry — action, actor, target, and the captured request metadata. */
export function AuditLogDetailDialog({ entry, open, onOpenChange }: AuditLogDetailDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={entry ? humanizeAction(entry.action) : 'Audit entry'}
      description={entry ? new Date(entry.createdAt).toLocaleString() : undefined}
      footer={
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      }
    >
      {entry ? (
        <dl className="divide-y divide-border">
          <Row label="Action">
            <code className="font-mono text-xs">{entry.action}</code>
          </Row>
          <Row label="Actor">
            {entry.actorId ?? <span className="text-muted-foreground">—</span>}{' '}
            <Badge tone="neutral">{formatActorType(entry.actorType)}</Badge>
          </Row>
          <Row label="Entity">
            {entry.entityType}
            {entry.entityId ? <span className="font-mono text-xs"> · {entry.entityId}</span> : null}
          </Row>
          <Row label="Request">
            <span className="font-mono text-xs">
              {entry.metadata.method ?? '—'} {entry.metadata.path ?? ''}
              {entry.metadata.statusCode ? ` → ${entry.metadata.statusCode}` : ''}
            </span>
          </Row>
          <Row label="Request ID">
            <code className="font-mono text-xs">{entry.metadata.requestId ?? '—'}</code>
          </Row>
          <Row label="IP">{entry.metadata.ip ?? '—'}</Row>
          <Row label="User agent">
            <span className="text-xs">{entry.metadata.userAgent ?? '—'}</span>
          </Row>
          {entry.before != null || entry.after != null ? (
            <Row label="Change">
              <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs">
                {JSON.stringify({ before: entry.before, after: entry.after }, null, 2)}
              </pre>
            </Row>
          ) : null}
        </dl>
      ) : null}
    </Modal>
  );
}
