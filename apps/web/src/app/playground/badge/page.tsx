'use client';

import { AddIcon } from '@stockflow/icons';
import { Badge } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const TONES = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const;

const USAGE = `import { Badge } from '@stockflow/ui';
import { AddIcon } from '@stockflow/icons';

// Status — "soft" is the default appearance
<Badge tone="success" dot>In stock</Badge>
<Badge tone="warning" dot>Low stock</Badge>
<Badge tone="danger" dot>Out of stock</Badge>

// Count — "solid"
<Badge appearance="solid" tone="primary">12</Badge>

// Category — "outline" / with an icon
<Badge appearance="outline">Category</Badge>
<Badge tone="primary" leadingIcon={AddIcon}>New</Badge>`;

const PROPS: PropRow[] = [
  { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'neutral'", description: 'Intent colour.' },
  { name: 'appearance', type: "'soft' | 'solid' | 'outline'", default: "'soft'", description: 'Fill style.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: '20px / 24px height.' },
  { name: 'dot', type: 'boolean', default: 'false', description: 'Leading status dot (inherits the tone colour).' },
  { name: 'leadingIcon / trailingIcon', type: 'LucideIcon', description: 'Decorative icon before / after the label.' },
];

export default function BadgeShowcase() {
  return (
    <ShowcasePage
      title="Badge"
      description="A non-interactive label for status, counts, and categories. Meaning lives in the text — colour is a redundant cue. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Section title="Tones (soft)">
        {TONES.map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
      </Section>

      <Section title="Appearance — solid">
        {TONES.map((tone) => (
          <Badge key={tone} appearance="solid" tone={tone}>
            {tone}
          </Badge>
        ))}
      </Section>

      <Section title="Appearance — outline">
        {TONES.map((tone) => (
          <Badge key={tone} appearance="outline" tone={tone}>
            {tone}
          </Badge>
        ))}
      </Section>

      <Section title="Stock status (with dot)">
        <Badge tone="success" dot>In stock</Badge>
        <Badge tone="warning" dot>Low stock</Badge>
        <Badge tone="danger" dot>Out of stock</Badge>
        <Badge tone="info" dot>In transit</Badge>
        <Badge tone="neutral" dot>Draft</Badge>
      </Section>

      <Section title="Counts & icons">
        <Badge appearance="solid" tone="primary">12</Badge>
        <Badge appearance="solid" tone="danger">3</Badge>
        <Badge appearance="solid" tone="neutral">99+</Badge>
        <Badge tone="primary" leadingIcon={AddIcon}>New</Badge>
      </Section>

      <Section title="Sizes">
        <Badge size="sm" tone="success" dot>Small</Badge>
        <Badge size="md" tone="success" dot>Medium</Badge>
      </Section>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Put the meaning in the <strong>text</strong> — the colour and dot are redundant cues, never
              the only signal.
            </>,
            <>
              <strong>soft</strong> for status (subtle in tables), <strong>solid</strong> for counts /
              emphasis, <strong>outline</strong> for quiet category labels.
            </>,
            <>
              Badge is <strong>non-interactive</strong> — don’t attach click handlers; use a{' '}
              <code className="font-mono">Button</code> or a future <code className="font-mono">Tag</code>{' '}
              for clickable/removable chips.
            </>,
            'Inventory mapping: In stock → success, Low → warning, Out → danger, Reserved/In transit → info.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
