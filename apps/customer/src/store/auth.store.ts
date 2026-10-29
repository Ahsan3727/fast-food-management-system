import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initPush, clearPushToken } from '@/lib/push';

export interface User {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  customerName: string;
  customerPhone: string;
  defaultAddress: string;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setCustomerProfile: (data: { name?: string; phone?: string; defaultAddress?: string }) => void;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      customerName: '',
      customerPhone: '',
      defaultAddress: '',
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setCustomerProfile: (data) =>
        set((state) => ({
          customerName: data.name !== undefined ? data.name : state.customerName,
          customerPhone: data.phone !== undefined ? data.phone : state.customerPhone,
          defaultAddress: data.defaultAddress !== undefined ? data.defaultAddress : state.defaultAddress,
        })),

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
        void initPush();
      },

      setUser: (user) =>
        set({
          user,
          customerName: user.name || '',
          customerPhone: user.phone || '',
        }),

      logout: () => {
        void clearPushToken();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'fastfood-auth',
      // Persist customer profile and refresh token
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        defaultAddress: state.defaultAddress,
      }),
    },
  ),
);
