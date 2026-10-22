import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminUser {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  role: 'admin' | 'staff';
}

interface AdminState {
  user: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  bootStatus: 'booting' | 'ready';
  setAuth: (payload: { accessToken: string; refreshToken: string; user: AdminUser }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AdminUser) => void;
  setBootStatus: (bootStatus: 'booting' | 'ready') => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      bootStatus: 'booting',
      setAuth: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user, bootStatus: 'ready' }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      setBootStatus: (bootStatus) => set({ bootStatus }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          bootStatus: 'ready',
        }),
    }),
    {
      name: 'fastfood-admin-auth',
      partialize: (s) => ({ refreshToken: s.refreshToken }),
    },
  ),
);

export const selectIsAuthenticated = (state: AdminState): boolean =>
  Boolean(state.accessToken && state.user && ['admin', 'staff'].includes(state.user.role));

