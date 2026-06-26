import type { Meta, StoryObj } from '@storybook/react';
import { AddIcon } from '@stockflow/icons';
import { Button } from '../button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from './tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  args: { content: 'Add a product' },
  argTypes: {
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    showArrow: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="outline">Hover me</Button>
    </Tooltip>
  ),
};

export const IconButton: Story = {
  render: (args) => (
    <Tooltip {...args} content="Add product">
      <Button size="icon" aria-label="Add product" leadingIcon={AddIcon} />
    </Tooltip>
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="flex gap-2">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side} side={side} content={`Side: ${side}`}>
          <Button variant="outline">{side}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const Composable: Story = {
  render: () => (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Button variant="outline">Composable</Button>
        </TooltipTrigger>
        <TooltipContent>Built from the parts</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  ),
};
