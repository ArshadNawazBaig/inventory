'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Avatar,
  Navbar,
  NavbarActions,
  NavbarSpacer,
  Sidebar,
  SidebarContent,
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
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { APP_NAV } from './app-nav';

/**
 * Authenticated application shell — a collapsible Sidebar + top Navbar built
 * entirely from @stockflow/ui. Session enforcement is added in the (app) layout
 * when the auth module lands; this is the chrome every authenticated page renders in.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider className="bg-background text-foreground">
      <Sidebar collapsible="icon" aria-label="Primary navigation" className="sticky top-0">
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              SF
            </span>
            <span className="font-semibold group-data-[state=collapsed]/sidebar:sr-only">
              StockFlow
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          {APP_NAV.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild active={active} tooltip={item.label}>
                        <Link href={item.href} aria-current={active ? 'page' : undefined}>
                          <Icon className="size-4" aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <Navbar>
          <SidebarTrigger />
          <NavbarSpacer />
          <NavbarActions>
            <NotificationBell />
            <ThemeToggle />
            <Avatar size="sm" name="StockFlow Team" />
          </NavbarActions>
        </Navbar>
        <main className="flex-1 overflow-x-hidden p-6 lg:p-10">{children}</main>
      </div>
    </SidebarProvider>
  );
}
