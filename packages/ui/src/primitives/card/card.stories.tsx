import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../button';
import { Badge } from '../badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

const meta: Meta<typeof Card> = {
  title: 'Display/Card',
  component: Card,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'elevated', 'ghost'] },
    interactive: { control: 'boolean' },
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

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Wireless Mouse</CardTitle>
        <CardDescription>SKU-001 · Accessories</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        120 units in stock across 3 warehouses.
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="outline" size="sm">
          Edit
        </Button>
        <Button size="sm">View</Button>
      </CardFooter>
    </Card>
  ),
};

export const Elevated: Story = { ...Default, args: { variant: 'elevated' } };
export const Ghost: Story = { ...Default, args: { variant: 'ghost' } };

export const WithBadge: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>USB-C Cable</CardTitle>
          <Badge tone="warning" dot>
            Low stock
          </Badge>
        </div>
        <CardDescription>SKU-114 · Cables</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">8 units left — reorder soon.</CardContent>
    </Card>
  ),
};

export const InteractiveLink: Story = {
  render: () => (
    <Card asChild interactive>
      <a href="#product">
        <CardHeader>
          <CardTitle>Clickable card</CardTitle>
          <CardDescription>Renders a real anchor via asChild</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The whole card is a focusable link.
        </CardContent>
      </a>
    </Card>
  ),
};
