'use client';

import { useState } from 'react';
import { Button, DialogClose, Input, Modal, type DialogSize } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const SIZES: DialogSize[] = ['sm', 'md', 'lg', 'xl'];

const USAGE = `import { Modal, Button, DialogClose } from '@stockflow/ui';

// Prop-driven preset over Dialog — the common case
<Modal
  trigger={<Button>Edit product</Button>}
  title="Edit product"
  description="Update the details, then save."
  footer={
    <>
      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
      <Button>Save changes</Button>
    </>
  }
>
  {/* body */}
</Modal>

// Controlled (open from anywhere)
<Modal open={open} onOpenChange={setOpen} title="…">…</Modal>`;

const PROPS: PropRow[] = [
  { name: 'title', type: 'ReactNode', description: 'Required — the accessible name.' },
  { name: 'description', type: 'ReactNode', description: 'Supporting text under the title.' },
  { name: 'trigger', type: 'ReactNode', description: 'A single element that opens the modal (asChild).' },
  { name: 'footer', type: 'ReactNode', description: 'Action buttons (wrap Cancel in DialogClose).' },
  { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl' | 'full'", default: "'md'", description: 'Max-width of the surface.' },
  { name: 'showClose', type: 'boolean', default: 'true', description: 'Render the ✕ close button.' },
  { name: 'open / onOpenChange / defaultOpen', type: 'boolean / fn / boolean', description: 'Controlled or uncontrolled open state.' },
];

export default function ModalShowcase() {
  const [open, setOpen] = useState(false);

  return (
    <ShowcasePage
      title="Modal"
      description="A prop-driven preset over Dialog for the common title + body + actions case. It adds no overlay logic — reach for Dialog parts when you need custom structure."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Section title="Default (trigger + footer)">
        <Modal
          trigger={<Button>Edit product</Button>}
          title="Edit product"
          description="Update the product details, then save."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button>Save changes</Button>
            </>
          }
        >
          <div className="grid gap-3">
            <Input aria-label="Name" defaultValue="Wireless Mouse" />
            <Input aria-label="SKU" defaultValue="SKU-001" />
          </div>
        </Modal>
      </Section>

      <Section title="Controlled (open from anywhere)">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open controlled modal
        </Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="Controlled modal"
          description="Its open state lives in the page, not the trigger."
          footer={<Button onClick={() => setOpen(false)}>Got it</Button>}
        >
          <p className="text-sm text-muted-foreground">Close with ✕, Esc, the overlay, or the button.</p>
        </Modal>
      </Section>

      <Section title="Sizes">
        {SIZES.map((size) => (
          <Modal
            key={size}
            size={size}
            trigger={<Button variant="outline">{size}</Button>}
            title={`Size: ${size}`}
            description={`This modal uses the ${size} max-width.`}
          />
        ))}
      </Section>

      <Section title="Confirm (destructive)">
        <Modal
          size="sm"
          trigger={<Button variant="destructive">Delete product</Button>}
          title="Delete this product?"
          description="This permanently removes the product and its variants. This can’t be undone."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive">Delete</Button>
            </>
          }
        />
      </Section>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Use <code className="font-mono">Modal</code> for the standard title + body + actions case;
              drop to <code className="font-mono">Dialog</code> parts for custom structure (header action,
              multiple sections).
            </>,
            <>
              <code className="font-mono">title</code> is required — it’s the accessible name. Wrap the
              Cancel button in <code className="font-mono">DialogClose</code> so it closes the modal.
            </>,
            <>
              Modal adds <strong>no</strong> overlay logic — focus trap, scroll-lock, and dismissal all come
              from Dialog/Radix.
            </>,
            'For destructive confirms that must not dismiss on outside-click, use AlertDialog (coming).',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
