'use client';

import { useState } from 'react';
import { Pagination } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { Pagination } from '@stockflow/ui';

const [page, setPage] = useState(1);

<Pagination
  page={page}
  pageCount={20}
  onPageChange={setPage}
  siblingCount={1}   // pages either side of the current one
  boundaryCount={1}  // pages pinned at the start/end
/>`;

const HOOK_USAGE = `// Build a custom layout from the same range algorithm + building blocks.
import { usePaginationRange, PaginationButton, PaginationEllipsis } from '@stockflow/ui';

const items = usePaginationRange({ page, pageCount, siblingCount: 1, boundaryCount: 1 });
// → [1, 'start-ellipsis', 4, 5, 6, 'end-ellipsis', 20]`;

const PROPS: PropRow[] = [
  { name: 'page', type: 'number', description: 'Current page (1-based). Controlled.' },
  { name: 'pageCount', type: 'number', description: 'Total number of pages. Renders nothing when ≤ 0.' },
  { name: 'onPageChange', type: '(page: number) => void', description: 'Fires with the next page, already clamped to 1..pageCount.' },
  { name: 'siblingCount', type: 'number', default: '1', description: 'Pages shown on each side of the current page.' },
  { name: 'boundaryCount', type: 'number', default: '1', description: 'Pages always shown at the start and end.' },
  { name: 'showPrevNext', type: 'boolean', default: 'true', description: 'Render the previous/next arrow controls.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Cell size.' },
  { name: 'label', type: 'string', default: "'Pagination'", description: 'Accessible label for the <nav> landmark.' },
];

export default function PaginationShowcase() {
  const [page, setPage] = useState(5);
  const [smallPage, setSmallPage] = useState(2);
  const [sizedPage, setSizedPage] = useState(3);
  const [numbersPage, setNumbersPage] = useState(2);
  const pageCount = 20;

  return (
    <ShowcasePage
      title="Pagination"
      description="A controlled, accessible page navigator. Computes the visible range (with ellipses) and fills the current page with the primary colour. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Live demo">
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 text-card-foreground">
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
          <p className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of {pageCount}
          </p>
        </div>
      </Block>

      <Section title="Few pages (all shown)">
        <Pagination page={smallPage} pageCount={5} onPageChange={setSmallPage} />
      </Section>

      <Section title="Sizes (sm · md · lg)">
        <div className="flex flex-col gap-4">
          <Pagination page={sizedPage} pageCount={10} onPageChange={setSizedPage} size="sm" />
          <Pagination page={sizedPage} pageCount={10} onPageChange={setSizedPage} size="md" />
          <Pagination page={sizedPage} pageCount={10} onPageChange={setSizedPage} size="lg" />
        </div>
      </Section>

      <Section title="Numbers only (no arrows)">
        <Pagination
          page={numbersPage}
          pageCount={5}
          onPageChange={setNumbersPage}
          showPrevNext={false}
        />
      </Section>

      <Block title="Custom layouts (hook + building blocks)">
        <p className="text-sm text-muted-foreground">
          Need a bespoke layout? Compose <code className="font-mono">PaginationButton</code> and{' '}
          <code className="font-mono">PaginationEllipsis</code> over the{' '}
          <code className="font-mono">usePaginationRange</code> hook — the same range algorithm the
          smart component uses.
        </p>
        <CodeBlock code={HOOK_USAGE} />
      </Block>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              It’s <strong>controlled</strong>: own <code className="font-mono">page</code> in state and
              update it from <code className="font-mono">onPageChange</code> (already clamped).
            </>,
            <>
              The current page carries <code className="font-mono">aria-current=&quot;page&quot;</code>{' '}
              and the primary fill; arrows disable at the boundaries.
            </>,
            <>
              Tune density with <code className="font-mono">siblingCount</code> /{' '}
              <code className="font-mono">boundaryCount</code>; an ellipsis only replaces a gap of more
              than one page.
            </>,
            'Pair with a “X–Y of N” summary and a page-size selector for data tables.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
