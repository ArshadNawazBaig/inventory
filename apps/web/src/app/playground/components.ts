/**
 * Registry that drives the playground sidebar. Each component on the roadmap is listed here;
 * `ready: true` renders a real link, otherwise it shows as "soon". Flip the flag when a component
 * ships so the sidebar stays in sync with the library (docs/README.md build order).
 */
export interface PlaygroundEntry {
  slug: string;
  name: string;
  ready: boolean;
}

export interface PlaygroundGroup {
  title: string;
  items: PlaygroundEntry[];
}

export const PLAYGROUND_GROUPS: PlaygroundGroup[] = [
  {
    title: 'Primitives',
    items: [{ slug: 'button', name: 'Button', ready: true }],
  },
  {
    title: 'Forms',
    items: [
      { slug: 'input', name: 'Input', ready: true },
      { slug: 'textarea', name: 'Textarea', ready: true },
      { slug: 'select', name: 'Select', ready: true },
      { slug: 'checkbox', name: 'Checkbox', ready: true },
      { slug: 'switch', name: 'Switch', ready: true },
      { slug: 'radio', name: 'Radio', ready: true },
    ],
  },
  {
    title: 'Display',
    items: [
      { slug: 'avatar', name: 'Avatar', ready: true },
      { slug: 'badge', name: 'Badge', ready: true },
      { slug: 'card', name: 'Card', ready: true },
    ],
  },
  {
    title: 'Overlays',
    items: [
      { slug: 'modal', name: 'Modal', ready: true },
      { slug: 'dialog', name: 'Dialog', ready: true },
      { slug: 'popover', name: 'Popover', ready: true },
      { slug: 'tooltip', name: 'Tooltip', ready: true },
      { slug: 'dropdown', name: 'Dropdown', ready: true },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { slug: 'sidebar', name: 'Sidebar', ready: true },
      { slug: 'navbar', name: 'Navbar', ready: true },
      { slug: 'pagination', name: 'Pagination', ready: true },
      { slug: 'breadcrumb', name: 'Breadcrumb', ready: true },
      { slug: 'tabs', name: 'Tabs', ready: true },
      { slug: 'accordion', name: 'Accordion', ready: true },
    ],
  },
  {
    title: 'Data',
    items: [
      { slug: 'table', name: 'Table', ready: true },
      { slug: 'data-grid', name: 'DataGrid', ready: true },
      { slug: 'charts', name: 'Charts', ready: true },
    ],
  },
  {
    title: 'Rich inputs',
    items: [
      { slug: 'file-upload', name: 'File Upload', ready: true },
      { slug: 'image-upload', name: 'Image Upload', ready: true },
      { slug: 'date-picker', name: 'Date Picker', ready: true },
      { slug: 'calendar', name: 'Calendar', ready: true },
    ],
  },
  {
    title: 'Feedback',
    items: [
      { slug: 'toast', name: 'Toast', ready: true },
      { slug: 'notification', name: 'Notification', ready: false },
      { slug: 'loading', name: 'Loading', ready: false },
      { slug: 'skeleton', name: 'Skeleton', ready: false },
    ],
  },
  {
    title: 'Search & command',
    items: [
      { slug: 'search', name: 'Search', ready: false },
      { slug: 'filters', name: 'Filters', ready: false },
      { slug: 'command-palette', name: 'Command Palette', ready: false },
    ],
  },
];

export const READY_COUNT = PLAYGROUND_GROUPS.flatMap((g) => g.items).filter((i) => i.ready).length;
export const TOTAL_COUNT = PLAYGROUND_GROUPS.flatMap((g) => g.items).length;
