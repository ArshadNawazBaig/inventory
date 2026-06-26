import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../button';
import { Spinner } from './spinner';
import { Progress } from './progress';
import { LoadingOverlay } from './loading-overlay';

const meta: Meta = {
  title: 'Feedback/Loading',
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj;

export const Spinners: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner size="xs" />
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
      <span className="text-primary">
        <Spinner size="lg" />
      </span>
      <Button disabled>
        <Spinner size="sm" aria-hidden />
        Saving…
      </Button>
    </div>
  ),
};

export const Progressbars: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <Progress value={25} />
      <Progress value={60} tone="success" />
      <Progress value={85} tone="warning" />
      <Progress value={40} tone="error" size="lg" />
      <Progress label="Working" />
    </div>
  ),
};

export const Overlay: Story = {
  render: function OverlayStory() {
    const [loading, setLoading] = useState(false);
    return (
      <div className="relative h-48 w-80 rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Panel content…</p>
        <Button className="mt-4" size="sm" onClick={() => setLoading((v) => !v)}>
          Toggle overlay
        </Button>
        <LoadingOverlay show={loading} label="Loading…" blur />
      </div>
    );
  },
};
