import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Rider {
  _id: string;
  name: string;
  phone?: string;
  role: string;
}

interface RiderAuthState {
  rider: Rider | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string) => void;
  setRider: (rider: Rider) => void;
  logout: () => void;
}

export const useRiderAuthStore = create<RiderAuthState>()(
  persist(
    (set) => ({
      rider: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken, isAuthenticated: true }),
      setRider: (rider) => set({ rider }),
      logout: () => set({ rider: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'fastfood-rider-auth',
      partialize: (s) => ({ refreshToken: s.refreshToken, rider: s.rider, isAuthenticated: s.isAuthenticated }),
    },
  ),
);
