import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { initPush } from '@/lib/push';
import { registerAppLifecycle } from '@/lib/lifecycle';
import { QK } from '@/api/queryKeys';

// App screens
import HomeScreen from '@/screens/HomeScreen';
import MenuScreen from '@/screens/MenuScreen';
import ProductDetailScreen from '@/screens/ProductDetailScreen';
import CartScreen from '@/screens/CartScreen';
import CheckoutScreen from '@/screens/CheckoutScreen';
import OrdersScreen from '@/screens/OrdersScreen';
import OrderDetailScreen from '@/screens/OrderDetailScreen';
import TrackOrderScreen from '@/screens/TrackOrderScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import SearchScreen from '@/screens/SearchScreen';

const CURRENT_VERSION = '1.0.0';

interface AppConfig {
  maintenanceMode?: boolean;
  minVersion?: string;
}

export default function App() {
  const { refreshToken, setTokens, setUser, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: config } = useQuery<AppConfig>({
    queryKey: ['app-config'],
    queryFn: () => api.get('/app-config').then(r => r.data),
    staleTime: 5 * 60_000,
  });

  // App lifecycle registration (native pause/resume, network online/offline)
  useEffect(() => {
    return registerAppLifecycle(
      () => {
        // Socket reconnect handler
      },
      () => {
        // Foreground data refresh
        void queryClient.invalidateQueries({ queryKey: QK.myOrders });
      },
    );
  }, [queryClient]);

  // On app start: try to restore session from persisted refresh token
  useEffect(() => {
    if (!refreshToken) return;
    api.post('/auth/refresh', { refreshToken })
      .then(({ data }) => {
        setTokens(data.accessToken, data.refreshToken);
        void initPush();
        return api.get('/users/me');
      })
      .then(({ data }) => setUser(data.user))
      .catch(() => logout());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Maintenance screen
  if (config?.maintenanceMode) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 24,
          background: 'var(--bg)',
          color: 'var(--text)',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 56, marginBottom: 16 }}>🛠️</span>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Under Maintenance</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 320, margin: 0 }}>
          We are currently performing scheduled maintenance to serve you better. Please check back shortly!
        </p>
      </div>
    );
  }

  // Force-update screen
  if (config?.minVersion && config.minVersion > CURRENT_VERSION) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 24,
          background: 'var(--bg)',
          color: 'var(--text)',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 56, marginBottom: 16 }}>🚀</span>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Update Required</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 320, margin: 0 }}>
          A new version of the app is available with important updates. Please update to continue.
        </p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Browsing & App screens — completely open with no login gate */}
      <Route path="/"                  element={<HomeScreen />} />
      <Route path="/menu"              element={<MenuScreen />} />
      <Route path="/menu/:id"          element={<ProductDetailScreen />} />
      <Route path="/search"            element={<SearchScreen />} />
      <Route path="/cart"              element={<CartScreen />} />
      <Route path="/checkout"          element={<CheckoutScreen />} />
      <Route path="/orders"            element={<OrdersScreen />} />
      <Route path="/orders/:id"        element={<OrderDetailScreen />} />
      <Route path="/orders/:id/track"  element={<TrackOrderScreen />} />
      <Route path="/profile"           element={<ProfileScreen />} />

      {/* Redirect old auth routes to home */}
      <Route path="/auth/*" element={<Navigate to="/" replace />} />
      <Route path="/login"  element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
