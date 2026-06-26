'use client';

import { Button, Toaster, toast } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { Toaster, toast } from '@stockflow/ui';

// 1. Mount once at the app root
<Toaster position="bottom-right" />

// 2. Call from anywhere
toast.success('Product saved');
toast.error('Import failed', { description: 'Check the file format.' });
toast('Item deleted', {
  action: { label: 'Undo', altText: 'Undo delete', onClick: restore },
});`;

const PROPS: PropRow[] = [
  { name: 'toast(title, opts?)', type: '(ReactNode, ToastOptions) => string', description: 'Base call (tone "default"). Returns the toast id.' },
  { name: 'toast.success / error / warning / info', type: 'fn', description: 'Tone shortcuts — coloured icon + accent.' },
  { name: 'toast.dismiss(id?)', type: 'fn', description: 'Dismiss one toast, or all when omitted.' },
  { name: 'options.description', type: 'ReactNode', description: 'Secondary line under the title.' },
  { name: 'options.duration', type: 'number', default: '5000', description: 'Auto-dismiss ms; Infinity = sticky.' },
  { name: 'options.action', type: '{ label, onClick, altText? }', description: 'An inline action button (e.g. Undo).' },
  { name: '<Toaster position>', type: "'bottom-right' | 'top-right' | …", default: "'bottom-right'", description: 'Where the stack sits.' },
  { name: '<Toaster duration>', type: 'number', default: '5000', description: 'Default auto-dismiss for all toasts.' },
];

export default function ToastShowcase() {
  return (
    <ShowcasePage
      title="Toast"
      description="Transient, non-blocking feedback. A token-skin over Radix Toast (region role, F8 focus, auto-dismiss that pauses on hover/blur, swipe-to-dismiss) driven by an imperative toast() API. Mount one <Toaster /> — it's already mounted on this page. Toggle dark mode from the navbar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Section title="Tones">
        <Button variant="outline" onClick={() => toast('Heads up', { description: 'A neutral message.' })}>
          Default
        </Button>
        <Button variant="outline" onClick={() => toast.success('Product saved')}>
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error('Import failed', { description: 'Check the file format.' })}
        >
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.warning('Low stock', { description: 'SKU A-100 is below its threshold.' })}
        >
          Warning
        </Button>
        <Button variant="outline" onClick={() => toast.info('Sync started')}>
          Info
        </Button>
      </Section>

      <Section title="With action / sticky / dismiss all">
        <Button
          onClick={() =>
            toast('Item deleted', {
              description: 'Bin 12 was removed.',
              action: { label: 'Undo', altText: 'Undo delete', onClick: () => toast.success('Restored') },
            })
          }
        >
          Delete with undo
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.warning('Action required', {
              description: 'This stays until dismissed.',
              duration: Infinity,
            })
          }
        >
          Sticky
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            toast.info('First');
            toast.info('Second');
            toast.info('Third');
          }}
        >
          Stack three
        </Button>
        <Button variant="ghost" onClick={() => toast.dismiss()}>
          Dismiss all
        </Button>
      </Section>

      <Section title="Props">
        <PropsTable rows={PROPS} />
      </Section>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Mount exactly one <code className="font-mono">&lt;Toaster /&gt;</code> at the app root; call{' '}
              <code className="font-mono">toast.*</code> from anywhere (event handlers, mutation{' '}
              <code className="font-mono">onSuccess</code>/<code className="font-mono">onError</code>).
            </>,
            'Use toasts for transient confirmations — not for critical errors that need acknowledgement (use a Dialog) or for content the user must act on before continuing.',
            <>
              Keep titles short; put detail in <code className="font-mono">description</code>. Offer an{' '}
              <code className="font-mono">action</code> (Undo) for destructive operations instead of a
              confirm dialog where possible.
            </>,
            'Don’t toast on every keystroke or for routine, expected outcomes — reserve them for noteworthy results.',
          ]}
        />
      </Block>

      <Toaster />
    </ShowcasePage>
  );
}
