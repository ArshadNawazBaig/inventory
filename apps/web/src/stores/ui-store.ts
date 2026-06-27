import { create } from 'zustand';

interface UiState {
  /** Desktop sidebar collapsed (icon-rail) state. */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  /** ⌘K command palette open state. */
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

/**
 * Ephemeral global UI chrome (sidebar + command palette) — small and sliced by
 * concern, no "god store". Server data never lives here (state-management.md).
 */
export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
