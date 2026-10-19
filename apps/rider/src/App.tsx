import { Routes, Route, Navigate } from 'react-router-dom';
import { useRiderAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import api from '@/lib/api';

import LoginScreen from '@/screens/LoginScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import OrderAssignedScreen from '@/screens/OrderAssignedScreen';
import EarningsScreen from '@/screens/EarningsScreen';
import ProfileScreen from '@/screens/ProfileScreen';

function Private({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useRiderAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function Public({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useRiderAuthStore();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  const { refreshToken, setTokens, setRider, logout } = useRiderAuthStore();

  useEffect(() => {
    if (!refreshToken) return;
    api.post('/auth/refresh', { refreshToken })
      .then(({ data }) => { setTokens(data.accessToken, data.refreshToken); return api.get('/users/me'); })
      .then(({ data }) => setRider(data.user))
      .catch(() => logout());
  }, []); // eslint-disable-line

  return (
    <Routes>
      <Route path="/login" element={<Public><LoginScreen /></Public>} />
      <Route path="/" element={<Private><DashboardScreen /></Private>} />
      <Route path="/order/:id" element={<Private><OrderAssignedScreen /></Private>} />
      <Route path="/earnings" element={<Private><EarningsScreen /></Private>} />
      <Route path="/profile" element={<Private><ProfileScreen /></Private>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
