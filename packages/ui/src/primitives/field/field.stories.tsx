import type { Meta, StoryObj } from '@storybook/react';
import { Field, FieldControl } from './field';
import { Input } from '../input';
import { Textarea } from '../textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '../select';

const meta: Meta<typeof Field> = {
  title: 'Primitives/Field',
  component: Field,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Field>;

export const Default: Story = {
  args: { label: 'Product name' },
  render: (args) => (
    <Field {...args}>
      <FieldControl>
        <Input placeholder="Wireless mouse" />
      </FieldControl>
    </Field>
  ),
};

export const WithDescription: Story = {
  args: { label: 'SKU', description: 'Letters, numbers, hyphens and underscores.' },
  render: (args) => (
    <Field {...args}>
      <FieldControl>
        <Input placeholder="TW-001" />
      </FieldControl>
    </Field>
  ),
};

export const Required: Story = {
  args: { label: 'Base unit', required: true },
  render: (args) => (
    <Field {...args}>
      <FieldControl>
        <Input placeholder="24-character id" />
      </FieldControl>
    </Field>
  ),
};

export const WithError: Story = {
  args: { label: 'SKU', required: true, error: 'SKU is required.' },
  render: (args) => (
    <Field {...args}>
      <FieldControl>
        <Input defaultValue="" />
      </FieldControl>
    </Field>
  ),
};

export const WithTextarea: Story = {
  args: { label: 'Description', description: 'Up to 5,000 characters.' },
  render: (args) => (
    <Field {...args}>
      <FieldControl>
        <Textarea placeholder="What is this product?" />
      </FieldControl>
    </Field>
  ),
};

export const WithSelect: Story = {
  args: { label: 'Status', error: 'Choose a status.' },
  render: (args) => (
    <Field {...args}>
      <Select>
        <FieldControl>
          <SelectTrigger placeholder="Select a status" />
        </FieldControl>
        <SelectContent>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  ),
};
