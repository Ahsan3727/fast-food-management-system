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

let isRefreshing = false;
let queue: Array<(t: string) => void> = [];

api.interceptors.response.use(res => res, async (err) => {
  const orig = err.config;
  if (err.response?.status === 401 && !orig._retry) {
    orig._retry = true;
    if (isRefreshing) return new Promise(r => queue.push(t => { orig.headers.Authorization = `Bearer ${t}`; r(api(orig)); }));
    isRefreshing = true;
    const { refreshToken, setTokens, logout } = useAdminStore.getState();
    try {
      const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken });
      setTokens(data.accessToken, data.refreshToken);
      queue.forEach(cb => cb(data.accessToken));
      queue = [];
      orig.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(orig);
    } catch { logout(); return Promise.reject(err); }
    finally { isRefreshing = false; }
  }
  return Promise.reject(err);
});

export default api;
