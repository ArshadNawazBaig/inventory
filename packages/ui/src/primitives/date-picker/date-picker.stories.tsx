import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from './date-picker';
import type { DateRange } from 'react-day-picker';

const meta: Meta<typeof DatePicker> = {
  title: 'Inputs/DatePicker',
  component: DatePicker,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof DatePicker>;

export const Single: Story = {
  render: function SingleStory() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="w-72">
        <DatePicker value={date} onChange={setDate} aria-label="Date" />
      </div>
    );
  },
};

export const Clearable: Story = {
  render: function ClearableStory() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="w-72">
        <DatePicker value={date} onChange={setDate} clearable aria-label="Date" />
      </div>
    );
  },
};

export const Range: Story = {
  render: function RangeStory() {
    const [range, setRange] = useState<DateRange | undefined>();
    return (
      <div className="w-80">
        <DatePicker mode="range" value={range} onChange={setRange} clearable aria-label="Date range" />
      </div>
    );
  },
};

export const DisabledDays: Story = {
  render: function DisabledDaysStory() {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <div className="w-72">
        <DatePicker
          value={date}
          onChange={setDate}
          disabledDays={[{ before: new Date() }, { dayOfWeek: [0, 6] }]}
          placeholder="Select a weekday"
          aria-label="Date"
        />
      </div>
    );
  },
};

export const Sizes: Story = {
  render: function SizesStory() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="flex w-72 flex-col gap-3">
        <DatePicker value={date} onChange={setDate} inputSize="sm" aria-label="Small" />
        <DatePicker value={date} onChange={setDate} inputSize="md" aria-label="Medium" />
        <DatePicker value={date} onChange={setDate} inputSize="lg" aria-label="Large" />
      </div>
    );
  },
};

export const Invalid: Story = {
  render: function InvalidStory() {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <div className="w-72">
        <DatePicker value={date} onChange={setDate} invalid aria-label="Date" />
      </div>
    );
  },
};
