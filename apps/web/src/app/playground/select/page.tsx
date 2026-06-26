'use client';

import { WarehouseIcon } from '@stockflow/icons';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, ShowcasePage, Surface, type PropRow } from '../_ui/showcase';

const USAGE = `import {
  Select, SelectTrigger, SelectContent, SelectItem,
  SelectGroup, SelectLabel, SelectSeparator,
} from '@stockflow/ui';

// Basic — single select from a known list
<Select defaultValue="fifo" onValueChange={(v) => save(v)}>
  <SelectTrigger placeholder="Select a method" />
  <SelectContent>
    <SelectItem value="fifo">FIFO</SelectItem>
    <SelectItem value="lifo">LIFO</SelectItem>
  </SelectContent>
</Select>

// Groups + icons + descriptions
<SelectContent>
  <SelectGroup>
    <SelectLabel>North region</SelectLabel>
    <SelectItem value="wh-1" icon={WarehouseIcon} description="Seattle, WA">
      Warehouse 1
    </SelectItem>
  </SelectGroup>
</SelectContent>

// React Hook Form — Select isn't a native input, so use Controller
<Controller
  name="category"
  control={control}
  render={({ field, fieldState }) => (
    <Select value={field.value} onValueChange={field.onChange}>
      <SelectTrigger invalid={!!fieldState.error} placeholder="Category" />
      <SelectContent>{/* items */}</SelectContent>
    </Select>
  )}
/>`;

const TRIGGER_PROPS: PropRow[] = [
  { name: 'variant', type: "'default' | 'filled' | 'ghost'", default: "'default'", description: 'Visual treatment (matches Input).' },
  { name: 'inputSize', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height/padding; lines up with Input/Button.' },
  { name: 'invalid', type: 'boolean', default: 'false', description: 'Error styling; sets aria-invalid on the trigger.' },
  { name: 'leadingIcon', type: 'LucideIcon', description: 'Decorative icon at the start (aria-hidden).' },
  { name: 'placeholder', type: 'string', description: 'Shown (muted) when no value is selected.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Set on <Select> to disable the whole control.' },
];

const ROOT_ITEM_PROPS: PropRow[] = [
  { name: '<Select> value / defaultValue', type: 'string', description: 'Controlled / uncontrolled value (on the root).' },
  { name: '<Select> onValueChange', type: '(value: string) => void', description: 'Fires when the selection changes.' },
  { name: '<Select> name / required', type: 'string / boolean', description: 'For native form submission / validation.' },
  { name: '<SelectItem> value', type: 'string', description: 'Required, unique within the Select.' },
  { name: '<SelectItem> icon / description', type: 'LucideIcon / string', description: 'Optional leading icon and secondary line.' },
  { name: '<SelectItem> disabled', type: 'boolean', default: 'false', description: 'Non-selectable option.' },
];

export default function SelectShowcase() {
  return (
    <ShowcasePage
      title="Select"
      description="Single-select from a known list, built on Radix. For searchable/remote lists use Combobox (coming); for many values use MultiSelect."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Surface title="Basic">
        <Select defaultValue="fifo">
          <SelectTrigger aria-label="Costing method" placeholder="Select a method" />
          <SelectContent>
            <SelectItem value="fifo">FIFO</SelectItem>
            <SelectItem value="lifo">LIFO</SelectItem>
            <SelectItem value="average">Weighted average</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger variant="filled" aria-label="Filled" placeholder="Filled variant" />
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      </Surface>

      <Surface title="Groups, icons & descriptions">
        <Select>
          <SelectTrigger
            aria-label="Location"
            placeholder="Select a location"
            leadingIcon={WarehouseIcon}
          />
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
      </Surface>

      <Surface title="Sizes, invalid & disabled">
        <Select>
          <SelectTrigger inputSize="sm" aria-label="Small" placeholder="Small" />
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger inputSize="lg" aria-label="Large" placeholder="Large" />
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger invalid aria-label="Invalid" placeholder="Required field" />
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
        <Select disabled defaultValue="a">
          <SelectTrigger aria-label="Disabled" placeholder="Disabled" />
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      </Surface>

      <Block title="Trigger props">
        <PropsTable rows={TRIGGER_PROPS} />
      </Block>

      <Block title="Root & item props">
        <PropsTable rows={ROOT_ITEM_PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Use Select for short, known lists. When users would want to <strong>search</strong> or
              the list is remote/large, reach for <code className="font-mono">Combobox</code> (coming).
            </>,
            <>
              Bind with React Hook Form’s <code className="font-mono">Controller</code> — Select isn’t a
              native input, so <code className="font-mono">register</code> won’t work.
            </>,
            <>
              Always label the trigger (via <code className="font-mono">&lt;Field&gt;</code> or{' '}
              <code className="font-mono">aria-label</code>); a placeholder is not a label.
            </>,
            'For thousands of options, use a virtualized Combobox instead of Select.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
