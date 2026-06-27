'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Avatar,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Navbar,
  NavbarActions,
  NavbarSpacer,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@stockflow/ui';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { PLAYGROUND_GROUPS, READY_COUNT, TOTAL_COUNT } from './components';

/** Monogram used as the row "icon" so the collapsed rail stays meaningful (no per-component icons). */
function Monogram({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-5 shrink-0 items-center justify-center text-xs font-semibold"
    >
      {label.charAt(0)}
    </span>
  );
}

/**
 * Persistent playground chrome built from our own components: an app-shell `Sidebar`
 * (collapsible icon rail) for component navigation and a `Navbar` with a `Breadcrumb`,
 * the shared `ThemeToggle`, and `Avatar`. Theme is now driven by the app-wide theme
 * store (on <html>), so the toggle re-themes the whole app at once.
 */
export function PlaygroundShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const current = useMemo(
    () => PLAYGROUND_GROUPS.flatMap((g) => g.items).find((i) => pathname === `/playground/${i.slug}`),
    [pathname],
  );

  return (
    <SidebarProvider className="bg-background text-foreground">
      <Sidebar collapsible="icon" aria-label="Component navigation" className="sticky top-0">
        <SidebarHeader>
          <Link
            href="/playground"
            className="flex items-center gap-2 px-2 py-1 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              SF
            </span>
            <span className="flex flex-col group-data-[state=collapsed]/sidebar:sr-only">
              <span className="text-sm font-semibold leading-tight">StockFlow UI</span>
              <span className="text-xs text-muted-foreground">
                {READY_COUNT} of {TOTAL_COUNT} components
              </span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          {PLAYGROUND_GROUPS.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => {
                  const href = `/playground/${item.slug}`;
                  const active = pathname === href;
                  return (
                    <SidebarMenuItem key={item.slug}>
                      {item.ready ? (
                        <SidebarMenuButton asChild active={active} tooltip={item.name}>
                          <Link href={href} aria-current={active ? 'page' : undefined}>
                            <Monogram label={item.name} />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          disabled
                          tooltip={`${item.name} — coming soon`}
                          className="opacity-50"
                        >
                          <Monogram label={item.name} />
                          <span>{item.name}</span>
                          <Badge appearance="soft" tone="neutral" size="sm" className="ml-auto">
                            soon
                          </Badge>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <p className="px-2 text-xs text-muted-foreground group-data-[state=collapsed]/sidebar:sr-only">
            v0.1 · token-driven
          </p>
        </SidebarFooter>
      </Sidebar>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <Navbar>
          <SidebarTrigger />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/playground">Playground</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {current ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{current.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : null}
            </BreadcrumbList>
          </Breadcrumb>
          <NavbarSpacer />
          <NavbarActions>
            <ThemeToggle />
            <Avatar size="sm" name="StockFlow Team" />
          </NavbarActions>
        </Navbar>

        <main className="flex-1 overflow-x-hidden p-6 lg:p-10">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
