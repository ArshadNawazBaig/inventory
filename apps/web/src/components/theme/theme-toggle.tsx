'use client';

import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from '@stockflow/icons';
import { Button } from '@stockflow/ui';
import { useThemeStore } from '@/stores/theme-store';

/** Light/dark toggle bound to the shared theme store. */
export function ThemeToggle() {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const toggle = useThemeStore((state) => state.toggle);

  // Avoid an icon hydration mismatch: render the stable default until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </Button>
  );
}
