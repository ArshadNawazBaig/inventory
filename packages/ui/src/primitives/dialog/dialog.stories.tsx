import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../button';
import { Input } from '../input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

const meta: Meta<typeof Dialog> = {
  title: 'Overlays/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
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
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-2">
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
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
    </div>
  ),
};

export const Confirm: Story = {
  render: () => (
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
  ),
};
