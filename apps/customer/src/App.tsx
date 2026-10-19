import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import api from '@/lib/api';

// Screens
import LoginScreen from '@/screens/LoginScreen';
import SignupScreen from '@/screens/SignupScreen';
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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

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
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupScreen /></PublicRoute>} />

      {/* Private */}
      <Route path="/" element={<PrivateRoute><HomeScreen /></PrivateRoute>} />
      <Route path="/menu" element={<PrivateRoute><MenuScreen /></PrivateRoute>} />
      <Route path="/menu/:id" element={<PrivateRoute><ProductDetailScreen /></PrivateRoute>} />
      <Route path="/search" element={<PrivateRoute><SearchScreen /></PrivateRoute>} />
      <Route path="/cart" element={<PrivateRoute><CartScreen /></PrivateRoute>} />
      <Route path="/checkout" element={<PrivateRoute><CheckoutScreen /></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><OrdersScreen /></PrivateRoute>} />
      <Route path="/orders/:id" element={<PrivateRoute><OrderDetailScreen /></PrivateRoute>} />
      <Route path="/orders/:id/track" element={<PrivateRoute><TrackOrderScreen /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfileScreen /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
