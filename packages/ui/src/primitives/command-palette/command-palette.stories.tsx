import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  DashboardIcon,
  ProductsIcon,
  WarehouseIcon,
  AddIcon,
  SettingsIcon,
  SearchIcon,
} from '@stockflow/icons';
import { Button } from '../button';
import { CommandPalette, type CommandAction } from './command-palette';

const meta: Meta<typeof CommandPalette> = {
  title: 'Search/CommandPalette',
  component: CommandPalette,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof CommandPalette>;

const ACTIONS: CommandAction[] = [
  { id: 'dashboard', label: 'Go to Dashboard', group: 'Navigation', icon: DashboardIcon, shortcut: 'G D', onSelect: () => {} },
  { id: 'products', label: 'Go to Products', group: 'Navigation', icon: ProductsIcon, shortcut: 'G P', onSelect: () => {} },
  { id: 'warehouses', label: 'Go to Warehouses', group: 'Navigation', icon: WarehouseIcon, keywords: ['locations'], onSelect: () => {} },
  { id: 'create-product', label: 'Create product', group: 'Actions', icon: AddIcon, shortcut: 'C', onSelect: () => {} },
  { id: 'search', label: 'Search inventory', group: 'Actions', icon: SearchIcon, onSelect: () => {} },
  { id: 'settings', label: 'Open settings', group: 'Actions', icon: SettingsIcon, onSelect: () => {} },
];

export const Default: Story = {
  render: function DefaultStory() {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex flex-col items-center gap-3">
        <Button onClick={() => setOpen(true)}>Open palette</Button>
        <p className="text-sm text-muted-foreground">…or press ⌘K / Ctrl+K</p>
        <CommandPalette open={open} onOpenChange={setOpen} actions={ACTIONS} />
      </div>
    );
  },
};

export const HotkeyOnly: Story = {
  render: () => (
    <div className="text-sm text-muted-foreground">
      Press ⌘K / Ctrl+K to open.
      <CommandPalette actions={ACTIONS} />
    </div>
  ),
};
