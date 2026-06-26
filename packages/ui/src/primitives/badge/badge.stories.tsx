import type { Meta, StoryObj } from '@storybook/react';
import { AddIcon } from '@stockflow/icons';
import { Badge } from './badge';

const TONES = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const;

const meta: Meta<typeof Badge> = {
  title: 'Display/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { children: 'Badge' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    appearance: { control: 'select', options: ['soft', 'solid', 'outline'] },
    size: { control: 'select', options: ['sm', 'md'] },
    dot: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {TONES.map((tone) => (
        <Badge key={tone} {...args} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const Appearances: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      {(['soft', 'solid', 'outline'] as const).map((appearance) => (
        <div key={appearance} className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <Badge key={tone} {...args} appearance={appearance} tone={tone}>
              {tone}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const StockStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="success" dot>In stock</Badge>
      <Badge tone="warning" dot>Low stock</Badge>
      <Badge tone="danger" dot>Out of stock</Badge>
      <Badge tone="info" dot>In transit</Badge>
      <Badge tone="neutral" dot>Draft</Badge>
    </div>
  ),
};

export const WithIcon: Story = { args: { leadingIcon: AddIcon, tone: 'primary', children: 'New' } };

export const Counts: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge appearance="solid" tone="primary">12</Badge>
      <Badge appearance="solid" tone="danger">3</Badge>
      <Badge appearance="solid" tone="neutral">99+</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Badge {...args} size="sm" tone="success">sm</Badge>
      <Badge {...args} size="md" tone="success">md</Badge>
    </div>
  ),
};
