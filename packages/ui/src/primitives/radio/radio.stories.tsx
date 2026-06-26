import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup, RadioGroupItem } from './radio';

const meta: Meta<typeof RadioGroup> = {
  title: 'Primitives/Radio',
  component: RadioGroup,
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
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

type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  args: { 'aria-label': 'Costing method', defaultValue: 'fifo' },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioGroupItem value="fifo">FIFO</RadioGroupItem>
      <RadioGroupItem value="lifo">LIFO</RadioGroupItem>
      <RadioGroupItem value="average">Weighted average</RadioGroupItem>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  args: { 'aria-label': 'Size', orientation: 'horizontal', defaultValue: 'm' },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioGroupItem value="s">Small</RadioGroupItem>
      <RadioGroupItem value="m">Medium</RadioGroupItem>
      <RadioGroupItem value="l">Large</RadioGroupItem>
    </RadioGroup>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <RadioGroup aria-label="Small" size="sm" defaultValue="a">
        <RadioGroupItem value="a">Small option A</RadioGroupItem>
        <RadioGroupItem value="b">Small option B</RadioGroupItem>
      </RadioGroup>
      <RadioGroup aria-label="Medium" size="md" defaultValue="a">
        <RadioGroupItem value="a">Medium option A</RadioGroupItem>
        <RadioGroupItem value="b">Medium option B</RadioGroupItem>
      </RadioGroup>
    </div>
  ),
};

export const Cards: Story = {
  args: { 'aria-label': 'Costing method', defaultValue: 'fifo' },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioGroupItem value="fifo" appearance="card">
        <span className="font-medium">FIFO</span>
        <span className="text-xs text-muted-foreground">First in, first out</span>
      </RadioGroupItem>
      <RadioGroupItem value="lifo" appearance="card">
        <span className="font-medium">LIFO</span>
        <span className="text-xs text-muted-foreground">Last in, first out</span>
      </RadioGroupItem>
      <RadioGroupItem value="average" appearance="card">
        <span className="font-medium">Weighted average</span>
        <span className="text-xs text-muted-foreground">Averaged unit cost</span>
      </RadioGroupItem>
    </RadioGroup>
  ),
};

export const Invalid: Story = {
  args: { 'aria-label': 'Costing method', invalid: true },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioGroupItem value="fifo">FIFO</RadioGroupItem>
      <RadioGroupItem value="lifo">LIFO</RadioGroupItem>
    </RadioGroup>
  ),
};

export const DisabledGroup: Story = {
  args: { 'aria-label': 'Costing method', disabled: true, defaultValue: 'fifo' },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioGroupItem value="fifo">FIFO</RadioGroupItem>
      <RadioGroupItem value="lifo">LIFO</RadioGroupItem>
    </RadioGroup>
  ),
};
