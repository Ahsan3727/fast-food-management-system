import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

/**
 * UI preferences store (WP11).
 * Single source of truth for the customer app's light/dark theme.
 * Persisted under 'ember_customer_theme' so index.html's inline
 * script can read it before React mounts (no FOUC).
 */
export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        document.documentElement.setAttribute('data-theme', next);
      },
    }),
    {
      name: 'ember_customer_theme',
    },
  ),
);
