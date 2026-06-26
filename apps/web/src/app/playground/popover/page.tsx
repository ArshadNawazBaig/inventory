'use client';

import { Button, Input, Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import {
  Popover, PopoverTrigger, PopoverContent, PopoverClose,
} from '@stockflow/ui';

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Details</Button>
  </PopoverTrigger>
  {/* role="dialog" → give the content an accessible name */}
  <PopoverContent aria-label="Product details">
    {/* rich content */}
  </PopoverContent>
</Popover>`;

const PROPS: PropRow[] = [
  { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", default: "'bottom'", description: 'Preferred side (flips to stay in view).' },
  { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Alignment along the side.' },
  { name: 'sideOffset', type: 'number', default: '8', description: 'Gap between trigger and panel.' },
  { name: 'showArrow', type: 'boolean', default: 'false', description: 'Render a pointer arrow.' },
  { name: '<Popover> open / onOpenChange / defaultOpen', type: 'boolean / fn / boolean', description: 'Controlled or uncontrolled open state.' },
  { name: 'Parts', type: 'PopoverTrigger · PopoverClose · PopoverAnchor', description: 'Trigger/close use asChild; anchor positions to another element.' },
];

export default function PopoverShowcase() {
  return (
    <ShowcasePage
      title="Popover"
      description="A non-modal floating panel for rich content (forms, info). The page stays usable — no scrim, no focus trap. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Section title="Info popover">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Product details</Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Product details" showArrow>
            <div className="space-y-1">
              <p className="text-sm font-medium">Wireless Mouse</p>
              <p className="text-sm text-muted-foreground">SKU-001 · 120 in stock · 3 warehouses</p>
            </div>
          </PopoverContent>
        </Popover>
      </Section>

      <Section title="Filter form">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Filter</Button>
          </PopoverTrigger>
          <PopoverContent aria-labelledby="filter-heading">
            <div className="grid gap-3">
              <p id="filter-heading" className="text-sm font-medium">
                Filter products
              </p>
              <Input aria-label="Min quantity" placeholder="Min quantity" inputSize="sm" />
              <Input aria-label="Max quantity" placeholder="Max quantity" inputSize="sm" />
              <div className="flex justify-end gap-2">
                <PopoverClose asChild>
                  <Button variant="ghost" size="sm">
                    Cancel
                  </Button>
                </PopoverClose>
                <Button size="sm">Apply</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </Section>

      <Section title="Alignments">
        {(['start', 'center', 'end'] as const).map((align) => (
          <Popover key={align}>
            <PopoverTrigger asChild>
              <Button variant="outline">{align}</Button>
            </PopoverTrigger>
            <PopoverContent align={align} aria-label={`Aligned ${align}`} showArrow className="w-48">
              <p className="text-sm">Aligned {align}</p>
            </PopoverContent>
          </Popover>
        ))}
      </Section>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Popover is for <strong>rich content</strong>; use <code className="font-mono">Dropdown</code>{' '}
              for a menu of actions, <code className="font-mono">Tooltip</code> for a brief hint, and{' '}
              <code className="font-mono">Dialog</code> for a blocking task.
            </>,
            <>
              It’s <strong>non-modal</strong> — the page isn’t scrimmed and focus isn’t trapped; outside-click
              and <code className="font-mono">Esc</code> close it.
            </>,
            <>
              <code className="font-mono">PopoverContent</code> is <code className="font-mono">role=&quot;dialog&quot;</code>,
              so name it (<code className="font-mono">aria-label</code> or{' '}
              <code className="font-mono">aria-labelledby</code> → its heading); the trigger needs a name too.
            </>,
            'Override the default w-72 via className when the content needs a different width.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
