import type { ResolvedTheme, ThemePreference } from '@/stores/theme-store';

/** localStorage key shared by ThemeProvider and the pre-hydration ThemeScript. */
export const THEME_STORAGE_KEY = 'sf-theme';

/** Resolve a preference to a concrete theme (reads the OS setting for 'system'). */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

/** Apply the resolved theme to <html> — the `.dark` class swaps every token at once. */
export function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}
