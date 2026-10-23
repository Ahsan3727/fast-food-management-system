import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import api from '@/lib/api';

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

export default function App() {
  const { refreshToken, setTokens, setUser, logout } = useAuthStore();

  // On app start: try to restore session from persisted refresh token
  useEffect(() => {
    if (!refreshToken) return;
    api.post('/auth/refresh', { refreshToken })
      .then(({ data }) => {
        setTokens(data.accessToken, data.refreshToken);
        return api.get('/users/me');
      })
      .then(({ data }) => setUser(data.user))
      .catch(() => logout());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
