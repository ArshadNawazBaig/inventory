'use client';

import { Avatar, AvatarGroup } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const IMG = 'https://i.pravatar.cc/128?img=12';
const IMG2 = 'https://i.pravatar.cc/128?img=32';

const USAGE = `import { Avatar, AvatarGroup } from '@stockflow/ui';

// Image with automatic fallback to initials
<Avatar src={user.photoUrl} name={user.fullName} />

// Initials only (no image) / generic icon (no name)
<Avatar name="Jane Doe" />
<Avatar alt="Unknown user" />

// Status + size + shape
<Avatar name="Jane Doe" status="online" size="lg" shape="square" />

// Overlapping group with +N overflow
<AvatarGroup max={4} size="sm">
  {members.map((m) => <Avatar key={m.id} name={m.name} src={m.photoUrl} />)}
</AvatarGroup>`;

const PROPS: PropRow[] = [
  { name: 'src', type: 'string', description: 'Image URL; falls back automatically if missing/broken.' },
  { name: 'alt', type: 'string', description: 'Image alt (defaults to name).' },
  { name: 'name', type: 'string', description: 'Accessible name + derives the initials fallback.' },
  { name: 'fallback', type: 'ReactNode', description: 'Override the fallback (e.g. a custom icon).' },
  { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: '24–64px (inherited from AvatarGroup).' },
  { name: 'shape', type: "'circle' | 'square'", default: "'circle'", description: 'Rounded-full or rounded-md.' },
  { name: 'status', type: "'online' | 'offline' | 'away' | 'busy'", description: 'Status dot + sr-only label.' },
  { name: '<AvatarGroup> max / size', type: 'number / AvatarSize', description: 'Cap visible count (then +N); size for all children.' },
];

export default function AvatarShowcase() {
  return (
    <ShowcasePage
      title="Avatar"
      description="A person/entity image with graceful fallback to initials or a user icon. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Section title="Fallback (image → initials → icon)">
        <Avatar src={IMG} name="Jane Doe" />
        <Avatar name="Jane Doe" />
        <Avatar alt="Unknown user" />
        <Avatar name="Jane" fallback="★" />
      </Section>

      <Section title="Sizes">
        <Avatar name="Jane Doe" size="xs" />
        <Avatar name="Jane Doe" size="sm" />
        <Avatar name="Jane Doe" size="md" />
        <Avatar name="Jane Doe" size="lg" />
        <Avatar name="Jane Doe" size="xl" />
      </Section>

      <Section title="Shape">
        <Avatar src={IMG} name="Jane Doe" shape="circle" />
        <Avatar src={IMG} name="Jane Doe" shape="square" />
        <Avatar name="Jane Doe" shape="square" />
      </Section>

      <Section title="Status">
        <Avatar name="Online" status="online" />
        <Avatar name="Away" status="away" />
        <Avatar name="Busy" status="busy" />
        <Avatar name="Offline" status="offline" />
      </Section>

      <Section title="Group (overlap + overflow)">
        <AvatarGroup max={4}>
          <Avatar name="One Person" src={IMG} />
          <Avatar name="Two Person" src={IMG2} />
          <Avatar name="Three Person" />
          <Avatar name="Four Person" />
          <Avatar name="Five Person" />
          <Avatar name="Six Person" />
        </AvatarGroup>
      </Section>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Provide <code className="font-mono">name</code> (or <code className="font-mono">alt</code>)
              for meaningful avatars — they become <code className="font-mono">role=&quot;img&quot;</code>{' '}
              with a name; without it, the avatar is treated as decorative.
            </>,
            <>
              Status is conveyed by the dot <strong>and</strong> a visually-hidden label (built in) — never
              colour alone.
            </>,
            <>
              Use <code className="font-mono">AvatarGroup</code> with <code className="font-mono">max</code>{' '}
              for member stacks instead of hand-rolling overlap.
            </>,
            'Fallback order: image → initials (from name) → user icon → your custom fallback.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
