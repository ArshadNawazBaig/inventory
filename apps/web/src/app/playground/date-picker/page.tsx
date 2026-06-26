'use client';

import { useState } from 'react';
import { DatePicker, type DateRange } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import { DatePicker } from '@stockflow/ui';

const [date, setDate] = useState<Date | undefined>();

<DatePicker value={date} onChange={setDate} clearable />`;

const PROPS: PropRow[] = [
  { name: 'mode', type: "'single' | 'range'", default: "'single'", description: 'single → Date · range → DateRange (value/onChange follow the mode).' },
  { name: 'value / onChange', type: 'Date | DateRange / fn', description: 'Controlled selection (shape matches mode). Omit for uncontrolled + defaultValue.' },
  { name: 'placeholder', type: 'string', default: "'Pick a date'", description: 'Shown when nothing is selected (mode-aware default).' },
  { name: 'dateFormat', type: 'string', default: "'PP'", description: 'date-fns format pattern for the trigger label.' },
  { name: 'variant / inputSize', type: "'default'|'filled'|'ghost' / 'sm'|'md'|'lg'", default: "'default' / 'md'", description: 'Field skin — matches Input/Select.' },
  { name: 'clearable', type: 'boolean', default: 'false', description: 'Show a ✕ button to reset the value.' },
  { name: 'disabledDays', type: 'Matcher | Matcher[]', description: 'Block days in the calendar (e.g. { before: today }, weekends).' },
  { name: 'invalid', type: 'boolean', default: 'false', description: 'Error skin + aria-invalid on the trigger.' },
];

export default function DatePickerShowcase() {
  const [single, setSingle] = useState<Date | undefined>();
  const [clearable, setClearable] = useState<Date | undefined>(new Date());
  const [range, setRange] = useState<DateRange | undefined>();
  const [weekday, setWeekday] = useState<Date | undefined>();

  return (
    <ShowcasePage
      title="Date Picker"
      description="A compact date field: a token-skinned trigger (matching Input) that opens the Calendar in a popover. Single date or range, controlled or uncontrolled, clearable, with day constraints. Toggle dark mode from the navbar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <div className="grid gap-8 lg:grid-cols-2">
        <Block title="Single">
          <DatePicker value={single} onChange={setSingle} aria-label="Date" className="max-w-xs" />
          <p className="text-sm text-muted-foreground">
            Selected:{' '}
            <span className="font-medium text-foreground">
              {single ? single.toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'none'}
            </span>
          </p>
        </Block>

        <Block title="Clearable">
          <DatePicker
            value={clearable}
            onChange={setClearable}
            clearable
            aria-label="Date"
            className="max-w-xs"
          />
          <p className="text-sm text-muted-foreground">A ✕ appears once a date is set.</p>
        </Block>

        <Block title="Range (2 months)">
          <DatePicker
            mode="range"
            value={range}
            onChange={setRange}
            clearable
            aria-label="Date range"
            className="max-w-sm"
          />
          <p className="text-sm text-muted-foreground">
            {range?.from
              ? `${range.from.toLocaleDateString('en-US', { dateStyle: 'medium' })} → ${
                  range.to ? range.to.toLocaleDateString('en-US', { dateStyle: 'medium' }) : '…'
                }`
              : 'No range selected'}
          </p>
        </Block>

        <Block title="Constrained (no past, no weekends)">
          <DatePicker
            value={weekday}
            onChange={setWeekday}
            disabledDays={[{ before: new Date() }, { dayOfWeek: [0, 6] }]}
            placeholder="Select a weekday"
            aria-label="Date"
            className="max-w-xs"
          />
        </Block>
      </div>

      <Section title="Variants & sizes">
        <div className="flex flex-col gap-3">
          <DatePicker inputSize="sm" defaultValue={new Date()} aria-label="Small" className="max-w-xs" />
          <DatePicker variant="filled" defaultValue={new Date()} aria-label="Filled" className="max-w-xs" />
          <DatePicker invalid placeholder="Required" aria-label="Invalid" className="max-w-xs" />
        </div>
      </Section>

      <Section title="Props">
        <PropsTable rows={PROPS} />
      </Section>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Pick <code className="font-mono">mode</code> by need — <strong>single</strong> for one date
              (received-on, expiry), <strong>range</strong> for periods (report windows, transfers).
            </>,
            <>
              In forms, keep it controlled — drive <code className="font-mono">value</code>/
              <code className="font-mono">onChange</code> via a React Hook Form{' '}
              <code className="font-mono">Controller</code>.
            </>,
            <>
              Constrain with <code className="font-mono">disabledDays</code> matchers (e.g.{' '}
              <code className="font-mono">{'{ before: today }'}</code>) instead of validating after the
              fact.
            </>,
            'For an always-visible picker, use the Calendar directly; the Date Picker wraps it in a popover.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
