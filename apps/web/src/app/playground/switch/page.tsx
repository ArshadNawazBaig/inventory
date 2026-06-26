'use client';

import { useState } from 'react';
import { Switch } from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, ShowcasePage, Surface, type PropRow } from '../_ui/showcase';

/** A settings row: clickable label + description on the left, switch on the right. */
function SwitchRow({
  id,
  label,
  description,
  ...props
}: { id: string; label: string; description?: string } & React.ComponentProps<typeof Switch>) {
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-4">
      <span>
        <span id={`${id}-label`} className="block text-sm font-medium">
          {label}
        </span>
        {description ? (
          <span className="block text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
      <Switch id={id} aria-labelledby={`${id}-label`} {...props} />
    </label>
  );
}

const USAGE = `import { Switch } from '@stockflow/ui';

// Basic (label via <Field>; here aria-labelledby)
<span id="alerts-label">Low-stock alerts</span>
<Switch id="alerts" aria-labelledby="alerts-label" defaultChecked />

// Controlled — settings usually apply immediately (no Save)
<Switch checked={enabled} onCheckedChange={setEnabled} />

// Optimistic: reflect immediately, revert + toast on failure
const onCheckedChange = async (next) => {
  setEnabled(next);
  try { await api.update({ enabled: next }); }
  catch { setEnabled(!next); toast.error('Could not save'); }
};`;

const PROPS: PropRow[] = [
  { name: 'checked', type: 'boolean', description: 'Controlled on/off (no indeterminate).' },
  { name: 'defaultChecked', type: 'boolean', description: 'Uncontrolled initial state.' },
  { name: 'onCheckedChange', type: '(checked: boolean) => void', description: 'Fires when toggled.' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Track 32×18 / 44×24.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks toggling and focus.' },
  { name: 'required / name / value', type: 'boolean / string / string', description: 'Native form semantics (value defaults to "on").' },
];

export default function SwitchShowcase() {
  const [autoReorder, setAutoReorder] = useState(true);
  const [alerts, setAlerts] = useState(false);

  return (
    <ShowcasePage
      title="Switch"
      description="A binary on/off control for instant-effect settings. Not a styled checkbox — use it when the change applies immediately."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Surface title="Settings (controlled)">
        <SwitchRow
          id="sw-auto-reorder"
          label="Auto-reorder"
          description="Reorder when stock hits the threshold"
          checked={autoReorder}
          onCheckedChange={setAutoReorder}
        />
        <SwitchRow
          id="sw-alerts"
          label="Low-stock alerts"
          description="Email me when an item runs low"
          checked={alerts}
          onCheckedChange={setAlerts}
        />
      </Surface>

      <Surface title="Sizes">
        <SwitchRow id="sw-sm" label="Small (sm)" size="sm" defaultChecked />
        <SwitchRow id="sw-md" label="Medium (md)" size="md" defaultChecked />
      </Surface>

      <Surface title="Disabled">
        <SwitchRow id="sw-disabled" label="Disabled (off)" disabled />
        <SwitchRow id="sw-disabled-on" label="Disabled (on)" disabled defaultChecked />
      </Surface>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Use a switch for a setting with <strong>instant effect</strong> (no Save). If the value is
              only applied on Save, it’s a <code className="font-mono">Checkbox</code>.
            </>,
            <>
              Settings usually mutate immediately — reflect the new state <strong>optimistically</strong>,
              then revert + toast on failure.
            </>,
            <>
              <strong>Confirm</strong> destructive instant toggles (e.g. “Disable all alerts”).
            </>,
            <>
              Always label it (via <code className="font-mono">&lt;Field&gt;</code> or{' '}
              <code className="font-mono">aria-labelledby</code>); state is conveyed by thumb position +
              colour + <code className="font-mono">aria-checked</code>, never colour alone.
            </>,
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
