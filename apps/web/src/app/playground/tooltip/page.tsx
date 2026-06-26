'use client';

import { AddIcon, EditIcon, DeleteIcon } from '@stockflow/icons';
import { Button, Tooltip } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { Tooltip } from '@stockflow/ui';
import { AddIcon } from '@stockflow/icons';

// Convenience — wraps a single focusable trigger
<Tooltip content="Add product">
  <Button size="icon" aria-label="Add product" leadingIcon={AddIcon} />
</Tooltip>

// For shared open/skip-delay coordination, mount one Provider at the app root:
import { TooltipProvider } from '@stockflow/ui';
<TooltipProvider>{app}</TooltipProvider>`;

const PROPS: PropRow[] = [
  { name: 'content', type: 'ReactNode', description: 'The hint shown on hover/focus.' },
  { name: 'children', type: 'ReactNode', description: 'The trigger — a single focusable element.' },
  { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", default: "'top'", description: 'Preferred side (flips to stay in view).' },
  { name: 'align', type: "'start' | 'center' | 'end'", description: 'Alignment along the side.' },
  { name: 'sideOffset', type: 'number', default: '6', description: 'Gap from the trigger.' },
  { name: 'delayDuration', type: 'number', default: '200', description: 'Hover delay (focus shows immediately).' },
  { name: 'showArrow', type: 'boolean', default: 'true', description: 'Render a pointer arrow.' },
  { name: 'open / onOpenChange / defaultOpen', type: 'boolean / fn / boolean', description: 'Controlled or uncontrolled (rare).' },
];

export default function TooltipShowcase() {
  return (
    <ShowcasePage
      title="Tooltip"
      description="A brief hint on hover and keyboard focus. Not for essential info or interactive content — use Popover for that. Toggle dark mode from the sidebar (the tip inverts automatically)."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Section title="Icon buttons (hover or focus me)">
        <Tooltip content="Add product">
          <Button size="icon" aria-label="Add product" leadingIcon={AddIcon} />
        </Tooltip>
        <Tooltip content="Edit">
          <Button size="icon" variant="outline" aria-label="Edit" leadingIcon={EditIcon} />
        </Tooltip>
        <Tooltip content="Delete">
          <Button size="icon" variant="ghost" aria-label="Delete" leadingIcon={DeleteIcon} />
        </Tooltip>
      </Section>

      <Section title="Text trigger">
        <Tooltip content="On-hand quantity across all warehouses">
          <Button variant="outline">Total stock</Button>
        </Tooltip>
      </Section>

      <Section title="Sides">
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <Tooltip key={side} side={side} content={`Side: ${side}`}>
            <Button variant="outline">{side}</Button>
          </Tooltip>
        ))}
      </Section>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Hints only. For interactive content or anything essential, use{' '}
              <code className="font-mono">Popover</code> / <code className="font-mono">Dialog</code> —
              tooltips are easy to miss and vanish.
            </>,
            <>
              The trigger must be <strong>focusable</strong> so the tip is reachable by keyboard; a tooltip
              on a disabled control won’t fire.
            </>,
            <>
              A tooltip is not a label — give icon-only buttons their own{' '}
              <code className="font-mono">aria-label</code> (the tip <em>describes</em>, it doesn’t name).
            </>,
            'Mount one TooltipProvider at the app root for coordinated open/skip-delay across tooltips.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
