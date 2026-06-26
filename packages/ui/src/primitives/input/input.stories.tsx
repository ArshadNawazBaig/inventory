import type { Meta, StoryObj } from '@storybook/react';
import { SearchIcon } from '@stockflow/icons';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { placeholder: 'Type here…', 'aria-label': 'Example' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'filled', 'ghost'] },
    inputSize: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {};
export const Filled: Story = { args: { variant: 'filled' } };
export const Ghost: Story = { args: { variant: 'ghost' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Input {...args} inputSize="sm" placeholder="Small" />
      <Input {...args} inputSize="md" placeholder="Medium" />
      <Input {...args} inputSize="lg" placeholder="Large" />
    </div>
  ),
};

export const WithLeadingIcon: Story = {
  args: { leadingIcon: SearchIcon, placeholder: 'Search products…' },
};

export const WithPrefixSuffix: Story = {
  args: { prefix: '$', suffix: 'USD', placeholder: '0.00' },
};

export const Clearable: Story = {
  args: { clearable: true, defaultValue: 'Clear me' },
};

export const Password: Story = {
  args: { type: 'password', defaultValue: 'secret', 'aria-label': 'Password' },
};

export const Loading: Story = {
  args: { loading: true, defaultValue: 'SKU-001', leadingIcon: SearchIcon },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: 'bad value' },
};

export const Disabled: Story = { args: { disabled: true, defaultValue: 'Disabled' } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'Read only (e.g. on-hand)' } };
