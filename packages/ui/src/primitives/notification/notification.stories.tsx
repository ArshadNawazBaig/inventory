import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../button';
import { Notification } from './notification';

const meta: Meta<typeof Notification> = {
  title: 'Feedback/Notification',
  component: Notification,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Notification>;

export const Tones: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      <Notification tone="info" title="Heads up">A new report export format is available.</Notification>
      <Notification tone="success" title="Stock count complete">Warehouse A reconciled with no variance.</Notification>
      <Notification tone="warning" title="Low stock">3 SKUs are below their reorder point.</Notification>
      <Notification tone="error" title="Sync failed">Could not reach the supplier API.</Notification>
      <Notification tone="neutral" title="Maintenance">Scheduled downtime Sunday 02:00–03:00 UTC.</Notification>
    </div>
  ),
};

export const Appearances: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      <Notification tone="warning" appearance="soft" title="Soft">Tinted surface (default).</Notification>
      <Notification tone="warning" appearance="outline" title="Outline">Neutral surface, tone border.</Notification>
      <Notification tone="warning" appearance="solid" title="Solid">Filled tone surface for high urgency.</Notification>
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Notification
      tone="warning"
      title="Low stock"
      className="max-w-xl"
      action={
        <>
          <Button size="sm">Reorder</Button>
          <Button size="sm" variant="ghost">
            View SKUs
          </Button>
        </>
      }
    >
      3 SKUs are below their reorder point.
    </Notification>
  ),
};

export const Dismissible: Story = {
  render: () => (
    <Notification tone="info" title="Tip" className="max-w-xl" onDismiss={() => {}}>
      You can bulk-edit variants from the products table.
    </Notification>
  ),
};

export const BodyOnly: Story = {
  render: () => (
    <Notification tone="neutral" className="max-w-xl">
      Read-only mode — you don’t have permission to edit this location.
    </Notification>
  ),
};
