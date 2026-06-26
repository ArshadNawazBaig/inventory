import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarGroup } from './avatar';

const IMG = 'https://i.pravatar.cc/128?img=12';

const meta: Meta<typeof Avatar> = {
  title: 'Display/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { name: 'Jane Doe' },
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'select', options: ['circle', 'square'] },
    status: { control: 'select', options: [undefined, 'online', 'offline', 'away', 'busy'] },
  },
};
export default meta;

type Story = StoryObj<typeof Avatar>;

export const Initials: Story = {};
export const Image: Story = { args: { src: IMG, alt: 'Jane Doe' } };
export const Icon: Story = { args: { name: undefined, alt: 'Unknown user' } };
export const Square: Story = { args: { shape: 'square', src: IMG } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Avatar key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const Statuses: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Avatar {...args} status="online" />
      <Avatar {...args} status="away" />
      <Avatar {...args} status="busy" />
      <Avatar {...args} status="offline" />
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup max={4}>
      <Avatar name="One Person" src={IMG} />
      <Avatar name="Two Person" />
      <Avatar name="Three Person" />
      <Avatar name="Four Person" />
      <Avatar name="Five Person" />
      <Avatar name="Six Person" />
    </AvatarGroup>
  ),
};
