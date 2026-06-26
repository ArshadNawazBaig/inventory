'use client';

import { Textarea } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, ShowcasePage, Surface, type PropRow } from '../_ui/showcase';

const USAGE = `import { Textarea } from '@stockflow/ui';

// Basic — compose inside <Field> for a label + counter + error
<Textarea placeholder="Description…" />

// Auto-resize: grows with content between minRows and maxRows, then scrolls
<Textarea autoResize minRows={2} maxRows={6} />

// Filled variant + length limit (the counter is rendered by <Field>)
<Textarea variant="filled" maxLength={500} />

// Controlled (React Hook Form: {...register('description')})
<Textarea value={value} onChange={(e) => setValue(e.target.value)} />`;

const PROPS: PropRow[] = [
  { name: 'variant', type: "'default' | 'filled' | 'ghost'", default: "'default'", description: 'Visual treatment (matches Input).' },
  { name: 'inputSize', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Font/padding/min-height.' },
  { name: 'invalid', type: 'boolean', default: 'false', description: 'Error styling; sets aria-invalid.' },
  { name: 'autoResize', type: 'boolean', default: 'false', description: 'Grow with content between minRows/maxRows. Forces resize="none".' },
  { name: 'minRows', type: 'number', default: '3', description: 'Auto-resize floor (also the default rows).' },
  { name: 'maxRows', type: 'number', default: '8', description: 'Auto-resize ceiling; past it the box scrolls.' },
  { name: 'resize', type: "'none' | 'vertical' | 'both'", default: "'vertical'", description: 'Manual resize handle. Ignored when autoResize is set.' },
  { name: 'disabled / readOnly', type: 'boolean', default: 'false', description: 'Disabled blocks edit + focus; readOnly stays focusable/copyable.' },
  { name: 'maxLength', type: 'number', description: 'Native limit; the visible counter comes from Field.' },
];

export default function TextareaShowcase() {
  return (
    <ShowcasePage
      title="Textarea"
      description="A bare multi-line control with optional auto-resize. Labels/counter/errors come from Field."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Surface title="Variants & states">
        <Textarea aria-label="Default notes" placeholder="Default (manual resize)…" />
        <Textarea aria-label="Filled notes" variant="filled" placeholder="Filled variant…" />
        <Textarea aria-label="Ghost notes" variant="ghost" placeholder="Ghost variant…" />
        <Textarea aria-label="Invalid notes" invalid defaultValue="Needs attention" />
        <Textarea aria-label="Disabled notes" disabled defaultValue="Disabled" />
      </Surface>

      <Surface title="Auto-resize">
        <Textarea
          aria-label="Auto-resizing notes"
          autoResize
          minRows={2}
          maxRows={6}
          placeholder="Type multiple lines — the box grows up to 6 rows, then scrolls…"
        />
      </Surface>

      <Surface title="Sizes">
        <Textarea aria-label="Small" inputSize="sm" placeholder="Small" />
        <Textarea aria-label="Medium" inputSize="md" placeholder="Medium" />
        <Textarea aria-label="Large" inputSize="lg" placeholder="Large" />
      </Surface>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Prefer <code className="font-mono">autoResize</code> for user-generated notes so the box
              fits the content.
            </>,
            <>
              <code className="font-mono">Enter</code> inserts a newline; wire ⌘/Ctrl+Enter to submit
              at the form level if you need it.
            </>,
            <>
              The character counter comes from <code className="font-mono">&lt;Field&gt;</code>, not the
              control — the control only enforces native{' '}
              <code className="font-mono">maxLength</code>.
            </>,
            'Use for free text only — not single-line values (use Input) or rich text.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
