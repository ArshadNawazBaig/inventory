'use client';

import { SearchIcon } from '@stockflow/icons';
import { Input } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, ShowcasePage, Surface, type PropRow } from '../_ui/showcase';

const USAGE = `import { Input } from '@stockflow/ui';
import { SearchIcon } from '@stockflow/icons';

// Basic — compose inside <Field> for a label + error message
<Input placeholder="SKU-001" />

// Adornments: icon, prefix/suffix
<Input leadingIcon={SearchIcon} placeholder="Search…" />
<Input prefix="$" suffix="USD" inputMode="decimal" />

// Clearable / password / async-loading
<Input clearable defaultValue="Acme" onClear={() => {}} />
<Input type="password" autoComplete="new-password" />
<Input loading />  {/* e.g. checking SKU uniqueness */}

// Error state (the message itself lives in <Field>)
<Input invalid aria-describedby="sku-error" />`;

const PROPS: PropRow[] = [
  { name: 'variant', type: "'default' | 'filled' | 'ghost'", default: "'default'", description: 'Visual treatment. Use "filled" on busy backgrounds.' },
  { name: 'inputSize', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height/padding (named to avoid the native `size` attribute).' },
  { name: 'invalid', type: 'boolean', default: 'false', description: 'Error styling; sets aria-invalid.' },
  { name: 'leadingIcon / trailingIcon', type: 'LucideIcon', description: 'Decorative icon at the start / end (aria-hidden).' },
  { name: 'prefix / suffix', type: 'ReactNode', description: 'Static addon inside the field (e.g. "$", "kg").' },
  { name: 'clearable', type: 'boolean', default: 'false', description: 'Shows a clear (✕) button when there is a value.' },
  { name: 'loading', type: 'boolean', default: 'false', description: 'Trailing spinner for async validation.' },
  { name: 'onClear', type: '() => void', description: 'Called when the clear button is pressed.' },
  { name: 'disabled / readOnly', type: 'boolean', default: 'false', description: 'Disabled blocks edit + focus; readOnly stays focusable/copyable.' },
  { name: 'type', type: "'text' | 'email' | 'password' | …", default: "'text'", description: 'Native input type. Password gets a reveal toggle.' },
];

export default function InputShowcase() {
  return (
    <ShowcasePage
      title="Input"
      description="A bare single-line control. Labels/errors come from Field. Shown on a card surface so it reads in both themes."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Surface title="Variants & adornments">
        <Input aria-label="Default" placeholder="Default" />
        <Input aria-label="Filled" variant="filled" placeholder="Filled variant" />
        <Input aria-label="Ghost" variant="ghost" placeholder="Ghost variant" />
        <Input aria-label="Search" leadingIcon={SearchIcon} placeholder="Search products…" />
        <Input aria-label="Price" prefix="$" suffix="USD" placeholder="0.00" />
      </Surface>

      <Surface title="Interactions & states">
        <Input aria-label="Clearable" clearable defaultValue="Clear me" />
        <Input aria-label="Password" type="password" defaultValue="secret" />
        <Input aria-label="Loading" loading defaultValue="Checking SKU…" />
        <Input aria-label="Invalid" invalid defaultValue="bad value" />
        <Input aria-label="Disabled" disabled defaultValue="Disabled" />
        <Input aria-label="Read only" readOnly defaultValue="Read only (e.g. on-hand)" />
      </Surface>

      <Surface title="Sizes">
        <Input aria-label="Small" inputSize="sm" placeholder="Small" />
        <Input aria-label="Medium" inputSize="md" placeholder="Medium" />
        <Input aria-label="Large" inputSize="lg" placeholder="Large" />
      </Surface>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Always pair with a <code className="font-mono">&lt;Field&gt;</code> for the label +
              error — a placeholder is <strong>not</strong> a label.
            </>,
            <>
              Pass icon props from a <strong>client component</strong>: they’re component functions,
              and a Server Component can’t pass them across the boundary.
            </>,
            <>
              Use <code className="font-mono">readOnly</code> (not{' '}
              <code className="font-mono">disabled</code>) for locked/derived values you still want
              users to read and copy.
            </>,
            <>
              For quantities/money prefer the upcoming{' '}
              <code className="font-mono">NumberInput</code>/<code className="font-mono">CurrencyInput</code>{' '}
              over <code className="font-mono">type=&quot;number&quot;</code>.
            </>,
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
