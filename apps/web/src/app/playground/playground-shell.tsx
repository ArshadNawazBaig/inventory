'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, cn } from '@stockflow/ui';
import { PLAYGROUND_GROUPS, READY_COUNT, TOTAL_COUNT } from './components';

const STORAGE_KEY = 'sf-playground-theme';
type Theme = 'light' | 'dark';

/**
 * Persistent playground chrome: a component sidebar + a dark-mode toggle. Lives in the route layout
 * so theme state and scroll position survive navigation between component routes. The toggle puts
 * `.dark` on the wrapper; because every component is token-driven, all of them re-theme at once.
 */
export function PlaygroundShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>('light');

  // Restore the last-used theme after mount (avoids SSR/hydration mismatch).
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') setTheme(stored);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <div className={theme === 'dark' ? 'dark' : undefined}>
      <div className="flex min-h-screen bg-background text-foreground">
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card text-card-foreground">
          <div className="border-b border-border p-4">
            <Link href="/playground" className="block">
              <p className="text-sm font-semibold">StockFlow UI</p>
              <p className="text-xs text-muted-foreground">
                {READY_COUNT} of {TOTAL_COUNT} components
              </p>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            {PLAYGROUND_GROUPS.map((group) => (
              <div key={group.title} className="mb-4">
                <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const href = `/playground/${item.slug}`;
                    const active = pathname === href;
                    return (
                      <li key={item.slug}>
                        {item.ready ? (
                          <Link
                            href={href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'block rounded-md px-2 py-1.5 text-sm transition-colors',
                              active
                                ? 'bg-accent font-medium text-accent-foreground'
                                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                            )}
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <span className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground/40">
                            {item.name}
                            <span className="text-[10px] uppercase tracking-wide">soon</span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-border p-3">
            <Button variant="outline" fullWidth onClick={toggleTheme}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </Button>
          </div>
        </aside>

        <main className="flex-1 overflow-x-hidden p-10">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
