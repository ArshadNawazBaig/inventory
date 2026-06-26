'use client';

import { useState } from 'react';
import { Checkbox } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, ShowcasePage, Surface, type PropRow } from '../_ui/showcase';

/** Pairs a Checkbox with a clickable label, named via aria-labelledby (the pattern Field will use). */
function CheckboxRow({
  id,
  label,
  ...props
}: { id: string; label: string } & React.ComponentProps<typeof Checkbox>) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} aria-labelledby={`${id}-label`} {...props} />
      <label id={`${id}-label`} htmlFor={id} className="text-sm">
        {label}
      </label>
    </div>
  );
}

const NOTIFY = [
  { value: 'low_stock', label: 'Low stock' },
  { value: 'reorder', label: 'Reorder approved' },
  { value: 'shipment', label: 'Shipment received' },
];

const USAGE = `import { Checkbox } from '@stockflow/ui';

// Basic (label + error come from <Field>; here we wire aria-labelledby by hand)
<Checkbox id="taxable" aria-labelledby="taxable-label" />
<label id="taxable-label" htmlFor="taxable">Taxable</label>

// Controlled
<Checkbox checked={checked} onCheckedChange={setChecked} />

// Indeterminate "select all" — derive the parent state, never store it
const parent = all ? true : some ? 'indeterminate' : false;
<Checkbox checked={parent} onCheckedChange={(v) => setAll(v === true)} />`;

const PROPS: PropRow[] = [
  { name: 'checked', type: "boolean | 'indeterminate'", description: 'Controlled state. "indeterminate" is visual/aria only — never submitted.' },
  { name: 'defaultChecked', type: 'boolean', description: 'Uncontrolled initial state.' },
  { name: 'onCheckedChange', type: "(checked: boolean | 'indeterminate') => void", description: 'Fires when the state changes.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: '16px / 20px box.' },
  { name: 'invalid', type: 'boolean', default: 'false', description: 'Error styling; sets aria-invalid.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks toggling and focus.' },
  { name: 'required / name / value', type: 'boolean / string / string', description: 'Native form semantics (value used in groups).' },
];

export default function CheckboxShowcase() {
  const [selected, setSelected] = useState<string[]>(['reorder']);
  const all = selected.length === NOTIFY.length;
  const some = selected.length > 0 && !all;
  const parentState: boolean | 'indeterminate' = all ? true : some ? 'indeterminate' : false;

  const toggle = (value: string, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)));

  return (
    <ShowcasePage
      title="Checkbox"
      description="A tri-state control (checked / unchecked / indeterminate). The label sits beside it via Field; indeterminate is derived, never stored."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Surface title="States">
        <CheckboxRow id="cb-unchecked" label="Unchecked" />
        <CheckboxRow id="cb-checked" label="Checked" defaultChecked />
        <CheckboxRow
          id="cb-indeterminate"
          label="Indeterminate"
          checked="indeterminate"
          onCheckedChange={() => {}}
        />
        <CheckboxRow id="cb-invalid" label="Invalid (must accept)" invalid />
        <CheckboxRow id="cb-disabled" label="Disabled" disabled />
        <CheckboxRow id="cb-disabled-checked" label="Disabled + checked" disabled defaultChecked />
      </Surface>

      <Surface title="Sizes">
        <CheckboxRow id="cb-sm" label="Small (sm)" size="sm" defaultChecked />
        <CheckboxRow id="cb-md" label="Medium (md)" size="md" defaultChecked />
      </Surface>

      <Surface title="Select all (indeterminate)">
        <CheckboxRow
          id="cb-all"
          label="Notify me about everything"
          checked={parentState}
          onCheckedChange={(v) => setSelected(v === true ? NOTIFY.map((o) => o.value) : [])}
        />
        <div className="ml-6 flex flex-col gap-2 border-l border-border pl-4">
          {NOTIFY.map((opt) => (
            <CheckboxRow
              key={opt.value}
              id={`cb-${opt.value}`}
              label={opt.label}
              checked={selected.includes(opt.value)}
              onCheckedChange={(v) => toggle(opt.value, v === true)}
            />
          ))}
        </div>
      </Surface>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Use a checkbox for a value <strong>submitted on Save</strong> or selecting items from a
              set. For an instant on/off setting use <code className="font-mono">Switch</code>; for
              one-of-many use <code className="font-mono">Radio</code>.
            </>,
            <>
              <code className="font-mono">indeterminate</code> is <strong>derived</strong> (some-but-not-all
              children checked) — compute it, never store it, and never submit it.
            </>,
            <>
              Always give it a label (via <code className="font-mono">&lt;Field&gt;</code> or{' '}
              <code className="font-mono">aria-labelledby</code>) — a <code className="font-mono">&lt;label for&gt;</code>{' '}
              alone doesn’t name the control (it’s a button, not an input).
            </>,
            'Selection is shown by the check/dash glyph + aria-checked, never by color alone.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
