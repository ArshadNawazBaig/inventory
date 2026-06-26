import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from './calendar';
import type { DateRange } from 'react-day-picker';

const meta: Meta<typeof Calendar> = {
  title: 'Inputs/Calendar',
  component: Calendar,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Calendar>;

export const Single: Story = {
  render: function SingleStory() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="rounded-xl border border-border bg-card">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </div>
    );
  },
};

export const Range: Story = {
  render: function RangeStory() {
    const [range, setRange] = useState<DateRange | undefined>();
    return (
      <div className="rounded-xl border border-border bg-card">
        <Calendar mode="range" numberOfMonths={2} selected={range} onSelect={setRange} />
      </div>
    );
  },
};

export const Multiple: Story = {
  render: function MultipleStory() {
    const [days, setDays] = useState<Date[] | undefined>([]);
    return (
      <div className="rounded-xl border border-border bg-card">
        <Calendar mode="multiple" selected={days} onSelect={setDays} />
      </div>
    );
  },
};

export const DisabledDays: Story = {
  render: () => (
    <div className="rounded-xl border border-border bg-card">
      <Calendar mode="single" disabled={[{ before: new Date() }, { dayOfWeek: [0, 6] }]} />
    </div>
  ),
};
