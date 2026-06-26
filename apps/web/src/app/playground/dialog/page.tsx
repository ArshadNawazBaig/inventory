'use client';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  type DialogSize,
} from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const SIZES: DialogSize[] = ['sm', 'md', 'lg', 'xl', 'full'];

const USAGE = `import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@stockflow/ui';

<Dialog>
  <DialogTrigger asChild>
    <Button>Edit product</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit product</DialogTitle>
      <DialogDescription>Update the details, then save.</DialogDescription>
    </DialogHeader>
    {/* body */}
    <DialogFooter>
      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
      <Button>Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Controlled
<Dialog open={open} onOpenChange={setOpen}>…</Dialog>`;

const PROPS: PropRow[] = [
  { name: '<Dialog> open / onOpenChange', type: 'boolean / (open: boolean) => void', description: 'Controlled open state.' },
  { name: '<Dialog> defaultOpen', type: 'boolean', description: 'Uncontrolled initial open state.' },
  { name: '<DialogContent> size', type: "'sm' | 'md' | 'lg' | 'xl' | 'full'", default: "'md'", description: 'Max-width of the surface.' },
  { name: '<DialogContent> showClose', type: 'boolean', default: 'true', description: 'Render the ✕ close button.' },
  { name: 'Parts', type: 'DialogTrigger · DialogClose · DialogHeader · DialogTitle · DialogDescription · DialogFooter', description: 'Trigger/close use asChild; layout helpers stack content.' },
];

export default function DialogShowcase() {
  return (
    <ShowcasePage
      title="Dialog"
      description="A modal surface with focus trap, scroll-lock, and Esc/overlay dismissal (Radix). The foundation overlay — Modal is a preset of this. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Section title="Edit dialog (form)">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Edit product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit product</DialogTitle>
              <DialogDescription>Update the product details, then save.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <Input aria-label="Name" defaultValue="Wireless Mouse" />
              <Input aria-label="SKU" defaultValue="SKU-001" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Sizes">
        {SIZES.map((size) => (
          <Dialog key={size}>
            <DialogTrigger asChild>
              <Button variant="outline">{size}</Button>
            </DialogTrigger>
            <DialogContent size={size}>
              <DialogHeader>
                <DialogTitle>Size: {size}</DialogTitle>
                <DialogDescription>This dialog uses the {size} max-width.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        ))}
      </Section>

      <Section title="Confirm (destructive)">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete product</Button>
          </DialogTrigger>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>Delete this product?</DialogTitle>
              <DialogDescription>
                This permanently removes the product and its variants. This can’t be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Always render a <code className="font-mono">DialogTitle</code> — Radix uses it for the
              accessible name (use a visually-hidden one if there’s no visible title).
            </>,
            <>
              Trigger and close use <code className="font-mono">asChild</code> to wrap your{' '}
              <code className="font-mono">Button</code> — keep one clear primary action.
            </>,
            <>
              For destructive confirms prefer an <code className="font-mono">AlertDialog</code> (coming) so
              clicking outside can’t dismiss it; default focus to the safe action.
            </>,
            'Modal is just a Dialog preset — don’t build a separate modal. Don’t nest dialogs.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
