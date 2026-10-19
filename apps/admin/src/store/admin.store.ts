import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser { _id: string; name: string; phone?: string; email?: string; role: string; }

interface AdminState {
  user: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (a: string, r: string) => void;
  setUser: (u: AdminUser) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: 'fastfood-admin-auth', partialize: s => ({ refreshToken: s.refreshToken, user: s.user, isAuthenticated: s.isAuthenticated }) },
  ),
);
