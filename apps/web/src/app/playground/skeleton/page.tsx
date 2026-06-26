'use client';

import { useState } from 'react';
import { Avatar, Button, Skeleton, SkeletonText } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { Skeleton, SkeletonText } from '@stockflow/ui';

// Size/shape with utility classes
<Skeleton className="h-10 w-10" />
<Skeleton variant="circle" className="size-12" />
<SkeletonText lines={3} />`;

const PROPS: PropRow[] = [
  { name: 'Skeleton.variant', type: "'rounded' | 'circle' | 'text'", default: "'rounded'", description: 'Placeholder shape (size with utility classes).' },
  { name: 'Skeleton.animation', type: "'pulse' | 'shimmer' | 'none'", default: "'pulse'", description: 'Motion treatment.' },
  { name: 'SkeletonText.lines', type: 'number', default: '3', description: 'Number of text-line bars.' },
  { name: 'SkeletonText.lastLineWidth', type: 'string', default: "'60%'", description: 'Width of the final (shortened) line.' },
];

export default function SkeletonShowcase() {
  const [loaded, setLoaded] = useState(false);

  return (
    <ShowcasePage
      title="Skeleton"
      description="Content-shaped placeholders shown while data loads — they convey layout, which reads as faster and less jarring than a spinner for known shapes. For unknown shapes or measurable waits, use Loading. Toggle dark mode from the navbar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Variants">
        <div className="flex flex-wrap items-center gap-6">
          <Skeleton className="h-16 w-40" />
          <Skeleton variant="circle" className="size-16" />
          <div className="w-56">
            <SkeletonText />
          </div>
        </div>
      </Block>

      <Block title="Animations">
        <div className="flex max-w-md flex-col gap-3">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">pulse (default)</p>
            <Skeleton animation="pulse" className="h-6 w-full" />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">shimmer</p>
            <Skeleton animation="shimmer" className="h-6 w-full" />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">none</p>
            <Skeleton animation="none" className="h-6 w-full" />
          </div>
        </div>
      </Block>

      <div className="grid gap-8 lg:grid-cols-2">
        <Block title="Media object">
          <div className="flex max-w-sm items-center gap-4">
            <Skeleton variant="circle" className="size-12 shrink-0" />
            <div className="flex-1">
              <SkeletonText lines={2} />
            </div>
          </div>
        </Block>

        <Block title="Card">
          <div className="w-full max-w-xs space-y-3 rounded-xl border border-border p-4">
            <Skeleton className="aspect-video w-full" animation="shimmer" />
            <Skeleton variant="text" className="w-3/4" />
            <SkeletonText lines={2} />
          </div>
        </Block>
      </div>

      <Block title="Swap to content when ready">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 text-card-foreground">
          {loaded ? (
            <div className="flex items-center gap-4">
              <Avatar name="StockFlow Team" />
              <div>
                <p className="text-sm font-medium">Warehouse A</p>
                <p className="text-sm text-muted-foreground">1,284 SKUs · 3 zones</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Skeleton variant="circle" className="size-10 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-1/2" />
                <Skeleton variant="text" className="w-3/4" />
              </div>
            </div>
          )}
        </div>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => setLoaded((v) => !v)}>
          {loaded ? 'Show skeleton' : 'Show content'}
        </Button>
      </Block>

      <Section title="Props">
        <PropsTable rows={PROPS} />
      </Section>

      <Block title="Guidelines">
        <Guidelines
          items={[
            'Match the skeleton to the real content’s shape and size — same line count, same avatar size — so the swap doesn’t shift layout.',
            <>
              Use Skeleton for content with a known shape (tables, cards, lists); use{' '}
              <strong>Spinner/Progress</strong> when the shape is unknown or the wait is measurable.
            </>,
            'Swap to real content as soon as it’s ready — don’t leave skeletons animating indefinitely.',
            'Skeletons are decorative (aria-hidden); announce the loading state on the region (aria-busy), not each placeholder.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
