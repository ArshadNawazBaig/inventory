import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../button';
import { Toaster } from './toast';
import { toast } from './toast-store';

const meta: Meta<typeof Toaster> = {
  title: 'Feedback/Toast',
  component: Toaster,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Toaster>;

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => toast('Heads up', { description: 'A neutral message.' })}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success('Product saved')}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error('Import failed', { description: 'Check the format.' })}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Low stock', { description: 'SKU A-100 below threshold.' })}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.info('Sync started')}>
        Info
      </Button>
      <Toaster />
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <div>
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
      <Toaster />
    </div>
  ),
};

export const Sticky: Story = {
  render: () => (
    <div>
      <Button onClick={() => toast.warning('Action required', { description: 'This stays until dismissed.', duration: Infinity })}>
        Sticky toast
      </Button>
      <Toaster />
    </div>
  ),
};
