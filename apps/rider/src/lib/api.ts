import axios from 'axios';
import { useRiderAuthStore } from '@/store/auth.store';

const RAW_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/v1';
export const API_ORIGIN = RAW_URL.replace(/\/v1\/?$/, '');
export const BASE_URL = RAW_URL.endsWith('/v1') ? RAW_URL : `${RAW_URL.replace(/\/$/, '')}/v1`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? API_ORIGIN;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json', 'X-Client': 'rider' },
});

api.interceptors.request.use((config) => {
  const token = useRiderAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue: Array<(t: string) => void> = [];

api.interceptors.response.use(res => res, async (error) => {
  const original = error.config;
  if (error.response?.status === 401 && !original._retry) {
    original._retry = true;
    if (isRefreshing) {
      return new Promise(resolve => {
        queue.push(t => { original.headers.Authorization = `Bearer ${t}`; resolve(api(original)); });
      });
    }
    isRefreshing = true;
    const { refreshToken, setTokens, logout } = useRiderAuthStore.getState();
    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      setTokens(data.accessToken, data.refreshToken);
      queue.forEach(cb => cb(data.accessToken));
      queue = [];
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch {
      logout();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
  return Promise.reject(error);
});

export default api;
