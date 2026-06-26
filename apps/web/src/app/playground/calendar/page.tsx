'use client';

import { useState } from 'react';
import { Calendar, type DateRange } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

// Fixed locale → deterministic on server and client (avoids hydration mismatch in this demo).
const fmt = (d: Date) => d.toLocaleDateString('en-US', { dateStyle: 'medium' });

const USAGE = `import { Calendar } from '@stockflow/ui';

const [date, setDate] = useState<Date | undefined>(new Date());

<Calendar mode="single" selected={date} onSelect={setDate} />`;

const PROPS: PropRow[] = [
  { name: 'mode', type: "'single' | 'multiple' | 'range'", default: "'single'", description: 'Selection behaviour.' },
  { name: 'selected / onSelect', type: 'Date | Date[] | DateRange / fn', description: 'Controlled selection (shape matches mode).' },
  { name: 'numberOfMonths', type: 'number', default: '1', description: 'Render multiple months side by side.' },
  { name: 'disabled', type: 'Matcher | Matcher[]', description: 'Disable days (e.g. { before: today }, weekends).' },
  { name: 'showOutsideDays', type: 'boolean', default: 'true', description: 'Show leading/trailing days of adjacent months.' },
  { name: 'classNames', type: 'Partial<ClassNames>', description: 'Override any internal part class (token-driven by default).' },
];

export default function CalendarShowcase() {
  const [single, setSingle] = useState<Date | undefined>(new Date());
  const [multiple, setMultiple] = useState<Date[] | undefined>([]);
  const [range, setRange] = useState<DateRange | undefined>();

  return (
    <ShowcasePage
      title="Calendar"
      description="A token-skinned date grid (single, multiple, or range) built on react-day-picker. The selected day fills with the primary colour; today is ringed. The foundation for Date Picker. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <div className="grid gap-8 lg:grid-cols-2">
        <Block title="Single">
          <div className="w-fit rounded-xl border border-border bg-card text-card-foreground">
            <Calendar mode="single" selected={single} onSelect={setSingle} />
          </div>
          <p className="text-sm text-muted-foreground">
            Selected:{' '}
            <span className="font-medium text-foreground">
              {single ? fmt(single) : 'none'}
            </span>
          </p>
        </Block>

        <Block title="Range (2 months)">
          <div className="w-fit rounded-xl border border-border bg-card text-card-foreground">
            <Calendar mode="range" numberOfMonths={2} selected={range} onSelect={setRange} />
          </div>
          <p className="text-sm text-muted-foreground">
            {range?.from ? fmt(range.from) : '—'} → {range?.to ? fmt(range.to) : '—'}
          </p>
        </Block>

        <Block title="Multiple">
          <div className="w-fit rounded-xl border border-border bg-card text-card-foreground">
            <Calendar mode="multiple" selected={multiple} onSelect={setMultiple} />
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{multiple?.length ?? 0}</span> day(s) selected
          </p>
        </Block>

        <Block title="With disabled days (no past, no weekends)">
          <div className="w-fit rounded-xl border border-border bg-card text-card-foreground">
            <Calendar
              mode="single"
              disabled={[{ before: new Date() }, { dayOfWeek: [0, 6] }]}
            />
          </div>
        </Block>
      </div>

      <Section title="Props">
        <PropsTable rows={PROPS} />
      </Section>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Pick <code className="font-mono">mode</code> by need — <strong>single</strong> for one date,{' '}
              <strong>range</strong> for periods (reports, transfers), <strong>multiple</strong> for ad-hoc
              sets.
            </>,
            <>
              It’s controlled: own the value in state and update from{' '}
              <code className="font-mono">onSelect</code>; the value’s shape follows{' '}
              <code className="font-mono">mode</code>.
            </>,
            <>
              Constrain input with <code className="font-mono">disabled</code> matchers (e.g.{' '}
              <code className="font-mono">{'{ before: today }'}</code>) rather than validating after the
              fact.
            </>,
            'For a compact field, the Date Picker (next) wraps this Calendar in a Popover.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
