import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const envUrl = import.meta.env.VITE_API_URL;
const isDeadHyperlift = envUrl && envUrl.includes('hyperlift.io');
const RAW_URL =
  !envUrl || isDeadHyperlift
    ? import.meta.env.PROD
      ? 'https://fast-food-management-system.onrender.com/v1'
      : 'http://localhost:5000/v1'
    : envUrl;
export const API_ORIGIN = RAW_URL.replace(/\/v1\/?$/, '');
export const BASE_URL = RAW_URL.endsWith('/v1') ? RAW_URL : `${RAW_URL.replace(/\/$/, '')}/v1`;

const socketEnv = import.meta.env.VITE_SOCKET_URL;
export const SOCKET_URL =
  !socketEnv || socketEnv.includes('hyperlift.io')
    ? import.meta.env.PROD
      ? 'https://fast-food-management-system.onrender.com'
      : API_ORIGIN
    : socketEnv;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json', 'X-Client': 'mobile' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh token on 401 + retry once
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        setTokens(data.accessToken, data.refreshToken);
        refreshQueue.forEach((cb) => cb(data.accessToken));
        refreshQueue = [];
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
  },
);

export default api;
