'use client';

import { useState } from 'react';
import { EditIcon, DeleteIcon, ExportIcon, MoreIcon } from '@stockflow/icons';
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, Section, ShowcasePage, type PropRow } from '../_ui/showcase';

const USAGE = `import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut,
} from '@stockflow/ui';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button size="icon" aria-label="Actions" leadingIcon={MoreIcon} />
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuItem onSelect={() => edit()}>
      <EditIcon /> Edit <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" onSelect={() => remove()}>
      <DeleteIcon /> Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`;

const PROPS: PropRow[] = [
  { name: '<DropdownMenuContent> align / side / sideOffset', type: "'start'|'center'|'end' / side / number", description: 'Positioning (collision-aware).' },
  { name: '<DropdownMenuItem> onSelect', type: '(e: Event) => void', description: 'Action; menu closes unless you preventDefault.' },
  { name: '<DropdownMenuItem> inset / variant', type: "boolean / 'default' | 'destructive'", description: 'Indent to align; tint dangerous actions.' },
  { name: '<DropdownMenuCheckboxItem> checked / onCheckedChange', type: 'boolean / fn', description: 'Toggle option (role menuitemcheckbox).' },
  { name: '<DropdownMenuRadioGroup> value / onValueChange', type: 'string / fn', description: 'Single-choice group of radio items.' },
  { name: 'Parts', type: 'Label · Separator · Shortcut · Group · Sub / SubTrigger / SubContent', description: 'Organize, hint shortcuts, and nest submenus.' },
];

export default function DropdownShowcase() {
  const [archived, setArchived] = useState(true);
  const [inactive, setInactive] = useState(false);
  const [sort, setSort] = useState('name');

  return (
    <ShowcasePage
      title="Dropdown menu"
      description="An action menu with full keyboard menu semantics. Not a form value (Select) or rich content (Popover) — a list of actions/options. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Section title="Actions menu (icons · shortcut · submenu · destructive)">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" aria-label="Actions" leadingIcon={MoreIcon} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Product</DropdownMenuLabel>
            <DropdownMenuItem>
              <EditIcon />
              Edit
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ExportIcon />
              Export
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Warehouse 1</DropdownMenuItem>
                <DropdownMenuItem>Warehouse 2</DropdownMenuItem>
                <DropdownMenuItem>Warehouse 3</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <DeleteIcon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section title="View options (checkbox items)">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">View</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Show</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={archived} onCheckedChange={setArchived}>
              Archived
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={inactive} onCheckedChange={setInactive}>
              Inactive
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section title="Sort by (radio group)">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Sort: {sort}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
              <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="qty">Quantity</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="updated">Last updated</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Dropdown is for <strong>actions/options</strong>. Use <code className="font-mono">Select</code>{' '}
              to pick a form value and <code className="font-mono">Popover</code> for rich content.
            </>,
            <>
              Name the trigger — an icon-only “⋯” needs an <code className="font-mono">aria-label</code>.
            </>,
            <>
              Organize long menus with <code className="font-mono">Label</code>/
              <code className="font-mono">Separator</code>/<code className="font-mono">Sub</code>; mark
              dangerous actions with <code className="font-mono">variant=&quot;destructive&quot;</code>.
            </>,
            'Checkbox/radio items keep their own state; selecting them can stay open for multi-toggle.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
