'use client';

import { useRef, useState } from 'react';
import { Button, LoadingOverlay, Progress, Spinner } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { Spinner, Progress, LoadingOverlay } from '@stockflow/ui';

<Spinner size="sm" />                       // inline busy indicator
<Progress value={62} tone="success" />      // determinate
<Progress />                                // indeterminate

// Cover a panel while it loads (parent must be relative)
<div className="relative">
  …panel…
  <LoadingOverlay show={loading} label="Loading…" blur />
</div>`;

const PROPS: PropRow[] = [
  { name: 'Spinner.size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Dimension; colour inherits via currentColor.' },
  { name: 'Spinner.label', type: 'string', default: "'Loading'", description: 'Accessible name (role="status").' },
  { name: 'Progress.value', type: 'number', description: 'Omit for an indeterminate bar; else 0..max.' },
  { name: 'Progress.tone', type: "'primary' | 'success' | 'warning' | 'error'", default: "'primary'", description: 'Bar colour.' },
  { name: 'Progress.size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Track height.' },
  { name: 'LoadingOverlay.show', type: 'boolean', default: 'true', description: 'Renders nothing when false.' },
  { name: 'LoadingOverlay.fullscreen', type: 'boolean', default: 'false', description: 'Cover the viewport vs the relative parent.' },
  { name: 'LoadingOverlay.blur', type: 'boolean', default: 'false', description: 'Blur the content behind.' },
];

export default function LoadingShowcase() {
  const [value, setValue] = useState(30);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runOverlay = () => {
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), 1800);
  };

  return (
    <ShowcasePage
      title="Loading"
      description="Active indicators that say work is in progress — a Spinner, a Progress bar (determinate or indeterminate), and a LoadingOverlay. For content with a known shape, prefer Skeleton. Toggle dark mode from the navbar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Spinner">
        <div className="flex flex-wrap items-center gap-6">
          <Spinner size="xs" />
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <Spinner size="xl" />
          <span className="text-primary">
            <Spinner size="lg" />
          </span>
          <span className="text-success">
            <Spinner size="lg" />
          </span>
          <Button disabled>
            <Spinner size="sm" aria-hidden />
            Saving…
          </Button>
        </div>
      </Block>

      <Block title="Progress">
        <div className="flex max-w-md flex-col gap-4">
          <Progress value={25} />
          <Progress value={60} tone="success" />
          <Progress value={85} tone="warning" />
          <Progress value={40} tone="error" size="lg" />
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Indeterminate</p>
            <Progress />
          </div>
          <div className="space-y-2">
            <Progress value={value} />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setValue((v) => Math.max(0, v - 10))}>
                −10
              </Button>
              <Button size="sm" variant="outline" onClick={() => setValue((v) => Math.min(100, v + 10))}>
                +10
              </Button>
              <span className="text-sm text-muted-foreground">{value}%</span>
            </div>
          </div>
        </div>
      </Block>

      <Block title="Loading overlay (scoped to a panel)">
        <div className="relative h-48 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card p-6 text-card-foreground">
          <p className="text-sm font-medium">Warehouse summary</p>
          <p className="mt-1 text-sm text-muted-foreground">
            On-hand, allocated, and incoming across 4 locations.
          </p>
          <Button className="mt-4" size="sm" onClick={runOverlay}>
            Reload
          </Button>
          <LoadingOverlay show={loading} label="Loading…" blur />
        </div>
        <p className="text-sm text-muted-foreground">
          The overlay covers its <code className="font-mono">relative</code> parent and clears after ~1.8s.
        </p>
      </Block>

      <Section title="Props">
        <PropsTable rows={PROPS} />
      </Section>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Use <strong>Progress</strong> when you know the percentage (uploads, imports);{' '}
              <strong>Spinner</strong> when you don’t.
            </>,
            'For content with a known shape (tables, cards), prefer Skeleton over a spinner — it conveys layout while loading.',
            'Scope the overlay to the affected panel; don’t block the whole screen for a small async action.',
            'Always give an indicator an accessible label; the components do by default (role="status"/"progressbar").',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
