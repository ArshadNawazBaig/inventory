import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { 'aria-label': 'Example' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
  },
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = {
  args: { checked: 'indeterminate', onCheckedChange: () => {} },
};
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = { args: { disabled: true, defaultChecked: true } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Checkbox {...args} size="sm" aria-label="Small" defaultChecked />
      <Checkbox {...args} size="md" aria-label="Medium" defaultChecked />
    </div>
  ),
};

export const WithLabel: Story = {
  render: (args) => (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox {...args} />
      Track inventory for this product
    </label>
  ),
};
