'use client';

import { useState } from 'react';
import { Button, Notification } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { Notification } from '@stockflow/ui';

<Notification
  tone="warning"
  title="Low stock"
  action={<Button size="sm">Reorder</Button>}
  onDismiss={() => hide()}
>
  3 SKUs are below their reorder point.
</Notification>`;

const PROPS: PropRow[] = [
  { name: 'tone', type: "'info' | 'success' | 'warning' | 'error' | 'neutral'", default: "'info'", description: 'Severity — drives the icon + colours.' },
  { name: 'appearance', type: "'soft' | 'outline' | 'solid'", default: "'soft'", description: 'Surface treatment.' },
  { name: 'title', type: 'ReactNode', description: 'Heading line (body is children).' },
  { name: 'icon', type: 'LucideIcon | null', description: 'Override the tone icon; null hides it.' },
  { name: 'action', type: 'ReactNode', description: 'Buttons/links row under the body.' },
  { name: 'onDismiss', type: '() => void', description: 'Shows a ✕; you own visibility (controlled).' },
  { name: 'role', type: 'string', default: "alert / status", description: 'Defaults: error/warning → alert, else status.' },
];

const TONES = ['info', 'success', 'warning', 'error', 'neutral'] as const;

export default function NotificationShowcase() {
  const [tips, setTips] = useState(['perf', 'bulk']);

  return (
    <ShowcasePage
      title="Notification"
      description="An inline, persistent alert banner — the in-page counterpart to the transient Toast. Tone × appearance on design tokens, with an icon, title, body, optional actions and dismiss. Toggle dark mode from the navbar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Tones (soft)">
        <div className="flex flex-col gap-3">
          <Notification tone="info" title="Heads up">A new report export format is available.</Notification>
          <Notification tone="success" title="Stock count complete">Warehouse A reconciled with no variance.</Notification>
          <Notification tone="warning" title="Low stock">3 SKUs are below their reorder point.</Notification>
          <Notification tone="error" title="Sync failed">Could not reach the supplier API.</Notification>
          <Notification tone="neutral" title="Maintenance">Scheduled downtime Sunday 02:00–03:00 UTC.</Notification>
        </div>
      </Block>

      <Block title="Appearances">
        <div className="grid gap-4 lg:grid-cols-3">
          {(['soft', 'outline', 'solid'] as const).map((appearance) => (
            <div key={appearance} className="flex flex-col gap-3">
              {TONES.map((tone) => (
                <Notification key={tone} tone={tone} appearance={appearance} title={tone}>
                  {appearance} · {tone}
                </Notification>
              ))}
            </div>
          ))}
        </div>
      </Block>

      <Block title="With actions">
        <Notification
          tone="warning"
          title="Low stock across 3 warehouses"
          action={
            <>
              <Button size="sm">Create reorder</Button>
              <Button size="sm" variant="ghost">
                View SKUs
              </Button>
            </>
          }
        >
          12 SKUs have dropped below their reorder point in the last 24 hours.
        </Notification>
      </Block>

      <Block title="Dismissible (controlled)">
        <div className="flex flex-col gap-3">
          {tips.includes('perf') ? (
            <Notification
              tone="info"
              title="Tip"
              onDismiss={() => setTips((t) => t.filter((x) => x !== 'perf'))}
            >
              Large imports run in the background — you can keep working.
            </Notification>
          ) : null}
          {tips.includes('bulk') ? (
            <Notification
              tone="neutral"
              title="Tip"
              onDismiss={() => setTips((t) => t.filter((x) => x !== 'bulk'))}
            >
              Bulk-edit variants directly from the products table.
            </Notification>
          ) : null}
          {tips.length === 0 ? (
            <Button variant="outline" size="sm" className="w-fit" onClick={() => setTips(['perf', 'bulk'])}>
              Restore tips
            </Button>
          ) : null}
        </div>
      </Block>

      <Section title="Props">
        <PropsTable rows={PROPS} />
      </Section>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Use Notification for <strong>persistent</strong> contextual messages; for transient confirmations
              use <code className="font-mono">toast()</code>.
            </>,
            'Pick tone by severity; keep one primary action and short copy.',
            <>
              Reserve <code className="font-mono">appearance=&quot;solid&quot;</code> for high-urgency notices —
              soft/outline read better in dense screens.
            </>,
            'Don’t stack many notifications — summarise (“12 SKUs low”) and link to detail.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
