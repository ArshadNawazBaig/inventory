'use client';

import { useEffect, type ReactNode } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { THEME_STORAGE_KEY, applyTheme, resolveTheme } from './theme';

/**
 * Hydrates the stored theme preference, keeps <html> in sync, and follows the OS
 * setting while in 'system'. The pre-hydration ThemeScript already painted the
 * correct theme; this keeps it correct as the preference or OS changes.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  // Adopt the persisted preference once on mount.
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setTheme(stored);
    }
  }, [setTheme]);

  // Apply + persist on change; track OS changes only while preference is 'system'.
  useEffect(() => {
    const resolved = resolveTheme(theme);
    applyTheme(resolved);
    useThemeStore.setState({ resolvedTheme: resolved });
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);

    if (theme !== 'system') {
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => {
      const next = resolveTheme('system');
      applyTheme(next);
      useThemeStore.setState({ resolvedTheme: next });
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  return <>{children}</>;
}
