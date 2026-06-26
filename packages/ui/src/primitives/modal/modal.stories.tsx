import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../button';
import { DialogClose } from '../dialog';
import { Modal } from './modal';

const meta: Meta<typeof Modal> = {
  title: 'Overlays/Modal',
  component: Modal,
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl', 'full'] },
  },
};
export default meta;

type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    trigger: <Button>Open modal</Button>,
    title: 'Edit product',
    description: 'Update the product details, then save.',
    children: <p className="text-sm text-muted-foreground">Body content goes here.</p>,
    footer: (
      <>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button>Save changes</Button>
      </>
    ),
  },
};

export const Confirm: Story = {
  args: {
    trigger: <Button variant="destructive">Delete</Button>,
    title: 'Delete this product?',
    description: 'This permanently removes the product and its variants. This can’t be undone.',
    size: 'sm',
    footer: (
      <>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button variant="destructive">Delete</Button>
      </>
    ),
  },
};
