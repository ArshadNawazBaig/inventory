'use client';

import { AddIcon, DeleteIcon } from '@stockflow/icons';
import { Button } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { Button } from '@stockflow/ui';
import { AddIcon } from '@stockflow/icons';

// Basic
<Button>Save</Button>

// Variant + size + leading icon
<Button variant="destructive" size="sm" leadingIcon={AddIcon}>
  Add
</Button>

// Loading — disables the button, shows a spinner, preserves width
<Button loading loadingText="Saving…">Save</Button>

// As a link — renders a real <a> but keeps button styling
<Button asChild>
  <a href="/products">View products</a>
</Button>`;

const PROPS: PropRow[] = [
  { name: 'variant', type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'", default: "'primary'", description: 'Visual emphasis / intent.' },
  { name: 'size', type: "'sm' | 'md' | 'lg' | 'icon'", default: "'md'", description: 'Height/padding. Use "icon" for square icon-only buttons.' },
  { name: 'asChild', type: 'boolean', default: 'false', description: 'Render styles onto the child (e.g. an <a>) via Radix Slot.' },
  { name: 'leadingIcon / trailingIcon', type: 'LucideIcon', description: 'Decorative icon before / after the label (aria-hidden).' },
  { name: 'loading', type: 'boolean', default: 'false', description: 'Shows a spinner, disables the button, sets aria-busy.' },
  { name: 'loadingText', type: 'string', description: 'Label shown/announced while loading.' },
  { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch to the container width.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Native disabled state.' },
  { name: 'type', type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'Defaults to "button" to avoid accidental form submits.' },
];

export default function ButtonShowcase() {
  return (
    <ShowcasePage
      title="Button"
      description="The primary action control. Use the sidebar toggle to preview dark mode."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Section title="Variants">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </Section>

      <Section title="Sizes">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Add" leadingIcon={AddIcon} />
      </Section>

      <Section title="With icons">
        <Button leadingIcon={AddIcon}>Add product</Button>
        <Button variant="destructive" trailingIcon={DeleteIcon}>
          Delete
        </Button>
      </Section>

      <Section title="States">
        <Button loading loadingText="Saving…">
          Save
        </Button>
        <Button loading variant="secondary">
          Loading
        </Button>
        <Button disabled>Disabled</Button>
        <Button fullWidth>Full width</Button>
      </Section>

      <Section title="As link (asChild)">
        <Button asChild>
          <a href="/playground">Playground home</a>
        </Button>
        <Button asChild variant="link">
          <a href="/playground">Back</a>
        </Button>
      </Section>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Use <code className="font-mono">asChild</code> for navigation so it renders a real{' '}
              <code className="font-mono">&lt;a&gt;</code> — never wrap a Button in a link.
            </>,
            <>
              <code className="font-mono">loading</code> already disables the button and sets{' '}
              <code className="font-mono">aria-busy</code> — don’t also pass{' '}
              <code className="font-mono">disabled</code>.
            </>,
            <>
              Icon-only buttons (<code className="font-mono">size=&quot;icon&quot;</code>) must have an{' '}
              <code className="font-mono">aria-label</code>.
            </>,
            'Keep one primary button per view; use secondary/outline/ghost for the rest.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
