'use client';

import { useState } from 'react';
import { MenuIcon, NotificationIcon, SearchIcon, SettingsIcon } from '@stockflow/icons';
import {
  Avatar,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Navbar,
  NavbarActions,
  NavbarBrand,
  NavbarLink,
  NavbarNav,
  NavbarSpacer,
} from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, ShowcasePage, type PropRow } from '../_ui/showcase';

const LINKS = [
  { slug: 'dashboard', label: 'Dashboard' },
  { slug: 'products', label: 'Products' },
  { slug: 'reports', label: 'Reports' },
];

const USAGE = `import {
  Navbar, NavbarBrand, NavbarNav, NavbarLink, NavbarSpacer, NavbarActions,
} from '@stockflow/ui';

<Navbar>
  <NavbarBrand asChild><a href="/">StockFlow</a></NavbarBrand>
  <NavbarNav aria-label="Primary">
    <NavbarLink asChild active><a href="/dashboard" aria-current="page">Dashboard</a></NavbarLink>
    <NavbarLink asChild><a href="/products">Products</a></NavbarLink>
  </NavbarNav>
  <NavbarSpacer />
  <NavbarActions>{/* search, notifications, avatar menu */}</NavbarActions>
</Navbar>`;

const PROPS: PropRow[] = [
  { name: '<Navbar> sticky', type: 'boolean', default: 'true', description: 'Stick to the top (z-30, below overlays).' },
  { name: '<NavbarBrand> asChild', type: 'boolean', default: 'false', description: 'Render the brand as a link.' },
  { name: '<NavbarNav>', type: '<nav>', description: 'Horizontal nav region — give it an aria-label.' },
  { name: '<NavbarLink> asChild / active', type: 'boolean / boolean', description: 'Render as a link; mark current (→ data-active).' },
  { name: '<NavbarSpacer>', type: 'div', description: 'flex-1 — pushes following content right.' },
  { name: '<NavbarActions>', type: 'div', description: 'Right-aligned group (search, icons, avatar/menu).' },
];

export default function NavbarShowcase() {
  const [active, setActive] = useState('dashboard');

  return (
    <ShowcasePage
      title="Navbar"
      description="The app-shell top bar (banner + horizontal nav + actions). Composes with Input, Button, Badge, Avatar, and Dropdown. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Live demo">
        <div className="overflow-hidden rounded-xl border border-border">
          <Navbar sticky={false}>
            <Button size="icon" variant="ghost" aria-label="Toggle menu" className="md:hidden">
              <MenuIcon className="size-4" />
            </Button>
            <NavbarBrand asChild>
              <a href="#home">
                <span className="size-6 rounded-md bg-primary" />
                StockFlow
              </a>
            </NavbarBrand>
            <NavbarNav aria-label="Primary" className="ml-2 hidden md:flex">
              {LINKS.map((link) => (
                <NavbarLink
                  key={link.slug}
                  asChild
                  active={active === link.slug}
                >
                  <a
                    href={`#${link.slug}`}
                    aria-current={active === link.slug ? 'page' : undefined}
                    onClick={() => setActive(link.slug)}
                  >
                    {link.label}
                  </a>
                </NavbarLink>
              ))}
            </NavbarNav>
            <NavbarSpacer />
            <NavbarActions>
              <Input
                aria-label="Search"
                leadingIcon={SearchIcon}
                placeholder="Search…"
                inputSize="sm"
                className="hidden w-56 sm:flex"
              />
              <span className="relative inline-flex">
                <Button size="icon" variant="ghost" aria-label="Notifications">
                  <NotificationIcon className="size-4" />
                </Button>
                <Badge
                  appearance="solid"
                  tone="danger"
                  size="sm"
                  className="absolute -right-0.5 -top-0.5 size-4 justify-center p-0"
                >
                  3
                </Badge>
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Account menu"
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Avatar size="sm" name="Jane Doe" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Jane Doe</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <SettingsIcon />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </NavbarActions>
          </Navbar>
          <div className="p-6 text-sm text-muted-foreground">
            Active section: <span className="font-medium text-foreground">{active}</span>
          </div>
        </div>
      </Block>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              One <strong>banner</strong> per page; label the <code className="font-mono">NavbarNav</code>{' '}
              (e.g. <code className="font-mono">aria-label=&quot;Primary&quot;</code>).
            </>,
            <>
              Use real links with <code className="font-mono">asChild</code> and set{' '}
              <code className="font-mono">aria-current=&quot;page&quot;</code> on the active route.
            </>,
            <>
              Group right-side controls in <code className="font-mono">NavbarActions</code>; icon-only
              buttons need an <code className="font-mono">aria-label</code>.
            </>,
            'Pair with Sidebar for the full shell; collapse horizontal nav to a menu on small screens.',
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
