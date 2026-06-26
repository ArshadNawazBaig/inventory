import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Primitives/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { placeholder: 'Type here…', 'aria-label': 'Example' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'filled', 'ghost'] },
    inputSize: { control: 'select', options: ['sm', 'md', 'lg'] },
    resize: { control: 'select', options: ['none', 'vertical', 'both'] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};
export const Filled: Story = { args: { variant: 'filled' } };
export const Ghost: Story = { args: { variant: 'ghost' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Textarea {...args} inputSize="sm" placeholder="Small" />
      <Textarea {...args} inputSize="md" placeholder="Medium" />
      <Textarea {...args} inputSize="lg" placeholder="Large" />
    </div>
  ),
};

export const AutoResize: Story = {
  args: {
    autoResize: true,
    minRows: 2,
    maxRows: 6,
    defaultValue: 'Start typing — the box grows with your content up to maxRows, then scrolls.',
  },
};

export const Invalid: Story = { args: { invalid: true, defaultValue: 'Needs attention' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Disabled' } };
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: 'Read only (e.g. a locked audit note)' },
};
