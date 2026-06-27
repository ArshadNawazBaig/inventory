# Command Palette — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `CommandPalette` (+ `Command*` primitives) (`@stockflow/ui` → `primitives/command-palette`) |
| **Status** | ✅ Implemented — cmdk + Dialog skin + tests + stories (Batch 8 · search & command) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [Dialog](./dialog.md) (overlay) · `cmdk` · `@stockflow/icons` |

> **Architecture decision:** the ⌘K palette is a token-skin over **`cmdk`** (the de-facto command-menu
> primitive, used by shadcn) hosted inside our existing [Dialog](./dialog.md). `cmdk` gives the parts we
> shouldn't re-implement — **combobox/listbox ARIA**, fuzzy filtering, full keyboard navigation
> (↑/↓/Home/End, Enter), groups, and the empty state — while our Dialog supplies the portal, overlay,
> focus-trap, and Escape handling (with `showClose={false}` and a visually-hidden title for a11y). We expose
> two layers: the low-level skinned **`Command*`** parts (`Command`, `CommandInput`, `CommandList`,
> `CommandGroup`, `CommandItem`, `CommandEmpty`, `CommandSeparator`, `CommandShortcut`) for bespoke menus,
> and a high-level **data-driven `CommandPalette`** (pass actions, get grouping + ⌘K/Ctrl+K toggle + run-and-
> close). Keyword search beyond the label is supported by folding `keywords` into each item's `value`. Adding
> `cmdk` is justified here as it is the standard accessible solution (consistent with adopting
> react-day-picker / recharts / @radix-ui/react-toast elsewhere). Tokens only; themes light/dark.

---

## 1. Overview

A global command menu: press ⌘K (Ctrl+K) to open an overlay, type to fuzzy-filter grouped commands, and run
one with the keyboard or mouse. For navigation ("Go to Products"), actions ("Create product"), and search.

---

## 2. API

```ts
CommandPalette                       // data-driven
  open? / defaultOpen?: boolean       // controlled / uncontrolled
  onOpenChange?: (open: boolean) => void
  actions: CommandAction[]
  placeholder?: string = 'Type a command or search…'
  emptyMessage?: ReactNode = 'No results found.'
  hotkey?: boolean = true             // ⌘K / Ctrl+K toggles open
  title?: string = 'Command palette'  // a11y (visually hidden)

interface CommandAction {
  id: string
  label: string
  group?: string                      // section heading
  icon?: LucideIcon
  shortcut?: string                   // hint shown at the row's end (e.g. 'G P')
  keywords?: string[]                 // extra search terms
  onSelect: () => void
  disabled?: boolean
}

// Low-level (compose your own): Command, CommandInput, CommandList, CommandEmpty,
// CommandGroup, CommandItem, CommandSeparator, CommandShortcut
```

---

## 3. Behavior

- **Open:** ⌘K/Ctrl+K toggles it (when `hotkey`), or drive `open`/`onOpenChange`. Escape / overlay click
  closes (Dialog).
- **Filter:** typing fuzzy-matches each action's `label` + `keywords`; non-matches hide; the empty state
  shows when nothing matches.
- **Navigate:** ↑/↓ move the highlight (wrapping), Home/End jump, Enter runs the highlighted action; the
  mouse highlights on hover.
- **Run:** selecting an action calls its `onSelect` and closes the palette; `disabled` actions are skipped.
- **Group:** actions with the same `group` are sectioned under a heading, separated by dividers.

---

## 4. Accessibility (acceptance criteria)

- `cmdk` provides the combobox input + listbox with `aria-selected`, active-descendant, and full keyboard
  support; our Dialog traps focus, restores it on close, and is labelled by a visually-hidden title.
- Items are reachable by keyboard and mouse; shortcut hints and icons are decorative; focus-visible styling
  via the selected state; AA contrast both themes.

---

## 5. Testing (plan)

- **Open/close:** the ⌘K hotkey opens it; Escape closes.
- **Render:** groups + items render with headings.
- **Filter:** typing narrows to matching items; non-matches disappear; keyword-only matches still show.
- **Run:** selecting an item calls `onSelect` and closes.
- **Empty:** a no-match query shows the empty message.
- **A11y:** `axe` passes when open.

---

## 6. Documentation (deliverables)

- **Storybook:** open via button + hotkey · grouped actions with icons/shortcuts · empty state · low-level
  composition; light + dark.
- **MDX do/don't:** mount once near the app root; group by area and keep labels action-oriented; add
  `keywords` for synonyms; use it for navigation/actions, Search for content search; don't bury critical
  actions only here.

---

## 7. Definition of Done

Typed (no `any`) · cmdk skin in our Dialog (combobox/listbox a11y, filtering, keyboard) · data-driven
`CommandPalette` + low-level `Command*` parts · ⌘K hotkey · groups/icons/shortcuts/keywords · run-and-close ·
controlled + uncontrolled · accessible (focus trap, labelled, axe) · token-only · Storybook · unit + a11y
tests. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
