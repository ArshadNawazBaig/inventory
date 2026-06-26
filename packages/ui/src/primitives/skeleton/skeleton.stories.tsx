import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonText } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Skeleton className="h-16 w-40" />
      <Skeleton variant="circle" className="size-16" />
      <div className="w-48">
        <SkeletonText />
      </div>
    </div>
  ),
};

export const Animations: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Skeleton animation="pulse" className="h-6 w-64" />
      <Skeleton animation="shimmer" className="h-6 w-64" />
      <Skeleton animation="none" className="h-6 w-64" />
    </div>
  ),
};

export const MediaObject: Story = {
  render: () => (
    <div className="flex max-w-sm items-center gap-4">
      <Skeleton variant="circle" className="size-12 shrink-0" />
      <div className="flex-1">
        <SkeletonText lines={2} />
      </div>
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div className="w-72 space-y-3 rounded-xl border border-border p-4">
      <Skeleton className="aspect-video w-full" animation="shimmer" />
      <Skeleton variant="text" className="w-3/4" />
      <SkeletonText lines={2} />
    </div>
  ),
};
