import axios from 'axios';
import { useAdminStore } from '@/store/admin.store';

const RAW_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/v1';
export const API_ORIGIN = RAW_URL.replace(/\/v1\/?$/, '');
export const BASE = RAW_URL.endsWith('/v1') ? RAW_URL : `${RAW_URL.replace(/\/$/, '')}/v1`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? API_ORIGIN;

export const api = axios.create({
  baseURL: BASE,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAdminStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { refreshToken, setTokens, logout } = useAdminStore.getState();
    if (!refreshToken) {
      logout();
      return null;
    }
    try {
      const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken });
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      logout();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    const isAuthRoute = orig?.url?.includes('/auth/login') || orig?.url?.includes('/auth/refresh');
    if (err.response?.status === 401 && orig && !orig._retry && !isAuthRoute) {
      orig._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        orig.headers.Authorization = `Bearer ${token}`;
        return api(orig);
      }
    }
    return Promise.reject(err);
  },
);

export default api;
