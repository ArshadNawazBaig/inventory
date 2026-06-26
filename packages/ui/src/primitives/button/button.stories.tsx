import type { Meta, StoryObj } from '@storybook/react';
import { AddIcon, DeleteIcon } from '@stockflow/icons';
import { Button } from './button';

/**
 * Button stories (CSF3). Storybook config is added in the component phase;
 * these stories are the canonical visual catalog + autodocs source.
 */
const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { children: 'Button' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'icon'] },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Outline: Story = { args: { variant: 'outline' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Destructive: Story = { args: { variant: 'destructive', children: 'Delete' } };
export const Link: Story = { args: { variant: 'link', children: 'Learn more' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

export const WithLeadingIcon: Story = {
  args: { leadingIcon: AddIcon, children: 'Add product' },
};

export const WithTrailingIcon: Story = {
  args: { trailingIcon: DeleteIcon, variant: 'destructive', children: 'Delete' },
};

export const IconOnly: Story = {
  args: { size: 'icon', leadingIcon: AddIcon, 'aria-label': 'Add product', children: undefined },
};

export const Loading: Story = {
  args: { loading: true, loadingText: 'Saving…', children: 'Save' },
};

export const Disabled: Story = { args: { disabled: true } };

export const FullWidth: Story = {
  args: { fullWidth: true },
  parameters: { layout: 'padded' },
};

export const AsLink: Story = {
  render: (args) => (
    <Button {...args} asChild>
      <a href="/products">Go to products</a>
    </Button>
  ),
};
