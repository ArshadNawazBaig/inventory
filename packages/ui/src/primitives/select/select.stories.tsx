import type { Meta, StoryObj } from '@storybook/react';
import { WarehouseIcon } from '@stockflow/icons';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from './select';

const meta: Meta<typeof Select> = {
  title: 'Primitives/Select',
  component: Select,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="Costing method" placeholder="Select a method" />
      <SelectContent>
        <SelectItem value="fifo">FIFO</SelectItem>
        <SelectItem value="lifo">LIFO</SelectItem>
        <SelectItem value="average">Weighted average</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Filled: Story = {
  render: () => (
    <Select defaultValue="fifo">
      <SelectTrigger variant="filled" aria-label="Costing method" placeholder="Select a method" />
      <SelectContent>
        <SelectItem value="fifo">FIFO</SelectItem>
        <SelectItem value="lifo">LIFO</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroupsAndDescriptions: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="Location" placeholder="Select a location" leadingIcon={WarehouseIcon} />
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North region</SelectLabel>
          <SelectItem value="wh-1" icon={WarehouseIcon} description="Seattle, WA">
            Warehouse 1
          </SelectItem>
          <SelectItem value="wh-2" icon={WarehouseIcon} description="Portland, OR">
            Warehouse 2
          </SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>South region</SelectLabel>
          <SelectItem value="wh-3" icon={WarehouseIcon} description="Austin, TX">
            Warehouse 3
          </SelectItem>
          <SelectItem value="wh-4" disabled icon={WarehouseIcon} description="Closed">
            Warehouse 4
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Select key={size}>
          <SelectTrigger inputSize={size} aria-label={size} placeholder={`Size ${size}`} />
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      ))}
    </div>
  ),
};

export const LongList: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="Country" placeholder="Select a country" />
      <SelectContent>
        {Array.from({ length: 40 }, (_, i) => (
          <SelectItem key={i} value={`item-${i}`}>
            Country {i + 1}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Select>
      <SelectTrigger invalid aria-label="Method" placeholder="Required field" />
      <SelectContent>
        <SelectItem value="fifo">FIFO</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled defaultValue="fifo">
      <SelectTrigger aria-label="Method" placeholder="Select a method" />
      <SelectContent>
        <SelectItem value="fifo">FIFO</SelectItem>
      </SelectContent>
    </Select>
  ),
};
