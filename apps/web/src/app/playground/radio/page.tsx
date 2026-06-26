'use client';

import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, ShowcasePage, Surface, type PropRow } from '../_ui/showcase';

const USAGE = `import { RadioGroup, RadioGroupItem } from '@stockflow/ui';

// Standard — the group owns the value; wrap in <Field> (fieldset/legend) for a group label
<RadioGroup value={value} onValueChange={setValue} aria-label="Costing method">
  <RadioGroupItem value="fifo">FIFO</RadioGroupItem>
  <RadioGroupItem value="lifo">LIFO</RadioGroupItem>
  <RadioGroupItem value="average">Weighted average</RadioGroupItem>
</RadioGroup>

// Card appearance — richer options with a title + description
<RadioGroupItem value="fifo" appearance="card">
  <span className="font-medium">FIFO</span>
  <span className="text-xs text-muted-foreground">First in, first out</span>
</RadioGroupItem>

// React Hook Form — not a native input, so use Controller (single string value)
<Controller name="method" control={control}
  render={({ field }) => (
    <RadioGroup value={field.value} onValueChange={field.onChange}>…</RadioGroup>
  )}
/>`;

const PROPS: PropRow[] = [
  { name: '<RadioGroup> value / defaultValue', type: 'string', description: 'Controlled / uncontrolled selected value.' },
  { name: '<RadioGroup> onValueChange', type: '(value: string) => void', description: 'Fires when the selection changes.' },
  { name: '<RadioGroup> size', type: "'sm' | 'md'", default: "'md'", description: 'Dot/label size for all items.' },
  { name: '<RadioGroup> orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Layout + arrow-key axis.' },
  { name: '<RadioGroup> invalid / disabled / required', type: 'boolean', default: 'false', description: 'Group-level error / disable-all / required.' },
  { name: '<RadioGroupItem> value', type: 'string', description: 'Required, unique within the group.' },
  { name: '<RadioGroupItem> appearance', type: "'standard' | 'card'", default: "'standard'", description: 'Dot + label, or selectable card.' },
  { name: '<RadioGroupItem> disabled', type: 'boolean', default: 'false', description: 'Non-selectable option.' },
];

export default function RadioShowcase() {
  const [method, setMethod] = useState('fifo');

  return (
    <ShowcasePage
      title="Radio"
      description="Pick exactly one from a small, all-visible set (2–6). The unit is the group, not the item. For more options or search use Select."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Surface title="Standard (controlled)">
        <RadioGroup aria-label="Costing method" value={method} onValueChange={setMethod}>
          <RadioGroupItem value="fifo">FIFO</RadioGroupItem>
          <RadioGroupItem value="lifo">LIFO</RadioGroupItem>
          <RadioGroupItem value="average">Weighted average</RadioGroupItem>
        </RadioGroup>
      </Surface>

      <Surface title="Horizontal & sizes">
        <RadioGroup aria-label="T-shirt size" orientation="horizontal" defaultValue="m">
          <RadioGroupItem value="s">Small</RadioGroupItem>
          <RadioGroupItem value="m">Medium</RadioGroupItem>
          <RadioGroupItem value="l">Large</RadioGroupItem>
        </RadioGroup>
        <RadioGroup aria-label="Density" size="sm" defaultValue="compact">
          <RadioGroupItem value="comfortable">Comfortable (sm)</RadioGroupItem>
          <RadioGroupItem value="compact">Compact (sm)</RadioGroupItem>
        </RadioGroup>
      </Surface>

      <Surface title="Card appearance">
        <RadioGroup aria-label="Costing method (cards)" defaultValue="fifo">
          <RadioGroupItem value="fifo" appearance="card">
            <span className="font-medium">FIFO</span>
            <span className="text-xs text-muted-foreground">First in, first out</span>
          </RadioGroupItem>
          <RadioGroupItem value="lifo" appearance="card">
            <span className="font-medium">LIFO</span>
            <span className="text-xs text-muted-foreground">Last in, first out</span>
          </RadioGroupItem>
          <RadioGroupItem value="average" appearance="card">
            <span className="font-medium">Weighted average</span>
            <span className="text-xs text-muted-foreground">Averaged unit cost</span>
          </RadioGroupItem>
        </RadioGroup>
      </Surface>

      <Surface title="Invalid & disabled">
        <RadioGroup aria-label="Invalid example" invalid>
          <RadioGroupItem value="a">Option A</RadioGroupItem>
          <RadioGroupItem value="b">Option B</RadioGroupItem>
        </RadioGroup>
        <RadioGroup aria-label="Disabled example" disabled defaultValue="a">
          <RadioGroupItem value="a">Option A</RadioGroupItem>
          <RadioGroupItem value="b">Option B</RadioGroupItem>
        </RadioGroup>
      </Surface>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Use radios for <strong>2–6 mutually-exclusive options shown at once</strong>. For more
              options or a searchable list use <code className="font-mono">Select</code>; for multi-pick
              use <code className="font-mono">Checkbox</code> groups.
            </>,
            <>
              Always give the group a label — wrap in <code className="font-mono">&lt;Field&gt;</code>{' '}
              (renders a <code className="font-mono">&lt;fieldset&gt;</code>/<code className="font-mono">&lt;legend&gt;</code>) or set{' '}
              <code className="font-mono">aria-label</code>.
            </>,
            <>
              Bind with React Hook Form’s <code className="font-mono">Controller</code> — it’s not a
              native input.
            </>,
            'Card appearance is purely visual — selection is still the filled dot + aria-checked, never colour alone.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
