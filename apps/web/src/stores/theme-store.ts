import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  /** The user's preference (may be 'system'). */
  theme: ThemePreference;
  /** The concrete theme currently applied to <html>. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggle: () => void;
}

/**
 * Theme preference store (global UI state → Zustand, per state-management.md).
 * DOM application + persistence happen in ThemeProvider; this holds the preference
 * and the resolved value that toggle UI reads.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: (theme) => set({ theme }),
  toggle: () => set({ theme: get().resolvedTheme === 'dark' ? 'light' : 'dark' }),
}));
