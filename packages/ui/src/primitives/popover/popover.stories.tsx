import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../button';
import { Input } from '../input';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './popover';

const meta: Meta<typeof Popover> = {
  title: 'Overlays/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-1">
          <p className="text-sm font-medium">Wireless Mouse</p>
          <p className="text-sm text-muted-foreground">SKU-001 · 120 in stock</p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const FilterForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Filter</Button>
      </PopoverTrigger>
      <PopoverContent showArrow>
        <div className="grid gap-3">
          <p className="text-sm font-medium">Filter products</p>
          <Input aria-label="Min quantity" placeholder="Min quantity" inputSize="sm" />
          <Input aria-label="Max quantity" placeholder="Max quantity" inputSize="sm" />
          <div className="flex justify-end gap-2">
            <PopoverClose asChild>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </PopoverClose>
            <Button size="sm">Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const Alignments: Story = {
  render: () => (
    <div className="flex gap-2">
      {(['start', 'center', 'end'] as const).map((align) => (
        <Popover key={align}>
          <PopoverTrigger asChild>
            <Button variant="outline">{align}</Button>
          </PopoverTrigger>
          <PopoverContent align={align} showArrow>
            <p className="text-sm">Aligned {align}</p>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
};
