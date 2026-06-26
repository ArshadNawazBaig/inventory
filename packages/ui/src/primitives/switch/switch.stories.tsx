import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';

const meta: Meta<typeof Switch> = {
  title: 'Primitives/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { 'aria-label': 'Example' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
  },
};
export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = { args: { disabled: true, defaultChecked: true } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Switch {...args} size="sm" aria-label="Small" defaultChecked />
      <Switch {...args} size="md" aria-label="Medium" defaultChecked />
    </div>
  ),
};

export const SettingsRow: Story = {
  render: (args) => (
    <label className="flex w-64 items-center justify-between gap-4 text-sm">
      <span>
        <span className="block font-medium">Auto-reorder</span>
        <span className="block text-muted-foreground">Reorder when stock hits the threshold</span>
      </span>
      <Switch {...args} defaultChecked />
    </label>
  ),
};
