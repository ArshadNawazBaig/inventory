import type { Meta, StoryObj } from '@storybook/react';
import { NotificationIcon, SearchIcon } from '@stockflow/icons';
import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { Button } from '../button';
import { Input } from '../input';
import { Navbar, NavbarActions, NavbarBrand, NavbarLink, NavbarNav, NavbarSpacer } from './navbar';

const meta: Meta<typeof Navbar> = {
  title: 'Navigation/Navbar',
  component: Navbar,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Navbar>;

export const Default: Story = {
  render: () => (
    <Navbar>
      <NavbarBrand asChild>
        <a href="#home">
          <span className="size-6 rounded-md bg-primary" />
          StockFlow
        </a>
      </NavbarBrand>
      <NavbarNav aria-label="Primary" className="ml-4">
        <NavbarLink href="#dashboard" active aria-current="page">
          Dashboard
        </NavbarLink>
        <NavbarLink href="#products">Products</NavbarLink>
        <NavbarLink href="#reports">Reports</NavbarLink>
      </NavbarNav>
      <NavbarSpacer />
      <NavbarActions>
        <Input
          aria-label="Search"
          leadingIcon={SearchIcon}
          placeholder="Search…"
          inputSize="sm"
          className="hidden w-56 sm:flex"
        />
        <Button size="icon" variant="ghost" aria-label="Notifications">
          <NotificationIcon className="size-4" />
        </Button>
        <Avatar size="sm" name="Jane Doe" />
      </NavbarActions>
    </Navbar>
  ),
};

export const WithNotificationBadge: Story = {
  render: () => (
    <Navbar>
      <NavbarBrand>StockFlow</NavbarBrand>
      <NavbarSpacer />
      <NavbarActions>
        <span className="relative inline-flex">
          <Button size="icon" variant="ghost" aria-label="Notifications">
            <NotificationIcon className="size-4" />
          </Button>
          <Badge
            appearance="solid"
            tone="danger"
            size="sm"
            className="absolute -right-1 -top-1 size-4 justify-center p-0"
          >
            3
          </Badge>
        </span>
        <Avatar size="sm" name="Jane Doe" />
      </NavbarActions>
    </Navbar>
  ),
};
