import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeChoice = 'system' | 'light' | 'dark';

interface UiState {
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
  toggleTheme: () => void;
}

/**
 * UI preferences store.
 * Single source of truth for the customer app's light/dark/system theme.
 * Persisted under 'ff-customer-theme' so index.html's inline
 * script can read it before React mounts (no FOUC).
 */
export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme });
        let resolved = theme;
        if (theme === 'system') {
          resolved = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', resolved);
        }
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
      },
    }),
    {
      name: 'ff-customer-theme',
    },
  ),
);
