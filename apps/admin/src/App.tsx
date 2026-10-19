import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/admin.store';
import api, { SOCKET_URL } from '@/lib/api';

import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import OrdersPage from '@/pages/OrdersPage';
import MenuPage from '@/pages/MenuPage';
import RidersPage from '@/pages/RidersPage';
import CustomersPage from '@/pages/CustomersPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import Sidebar from '@/components/Sidebar';

function Private({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAdminStore();
  const qc = useQueryClient();
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const location = useLocation();

  // Real-time new order notifications
  useEffect(() => {
    if (!accessToken) return;
    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.on('order:new', (order: any) => {
      toast(`🔔 New order #${order.orderNumber} — Rs. ${(order.totalPaisa / 100).toFixed(0)}`, {
        duration: 6000,
        style: { background: 'rgba(249,115,22,0.9)', color: 'white', fontWeight: '700' },
      });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    });
    return () => { socket.disconnect(); };
  }, [accessToken, qc]);

  return (
    <div className="admin-layout">
      <Sidebar currentPath={location.pathname} />
      <div className="admin-main">
        <div className="admin-header">
          <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>
            {location.pathname === '/' ? '📊 Dashboard' :
             location.pathname === '/orders' ? '🧾 Orders' :
             location.pathname === '/menu' ? '🍔 Menu Manager' :
             location.pathname === '/riders' ? '🏍️ Riders' :
             location.pathname === '/customers' ? '👥 Customers' :
             location.pathname === '/analytics' ? '📈 Analytics' : 'Admin'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</span>
          </div>
        </div>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const { refreshToken, setTokens, setUser, logout, isAuthenticated } = useAdminStore();

  useEffect(() => {
    if (!refreshToken) return;
    api.post('/auth/refresh', { refreshToken })
      .then(({ data }) => { setTokens(data.accessToken, data.refreshToken); return api.get('/users/me'); })
      .then(({ data }) => setUser(data.user))
      .catch(() => logout());
  }, []); // eslint-disable-line

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<Private><AdminLayout><DashboardPage /></AdminLayout></Private>} />
      <Route path="/orders" element={<Private><AdminLayout><OrdersPage /></AdminLayout></Private>} />
      <Route path="/menu" element={<Private><AdminLayout><MenuPage /></AdminLayout></Private>} />
      <Route path="/riders" element={<Private><AdminLayout><RidersPage /></AdminLayout></Private>} />
      <Route path="/customers" element={<Private><AdminLayout><CustomersPage /></AdminLayout></Private>} />
      <Route path="/analytics" element={<Private><AdminLayout><AnalyticsPage /></AdminLayout></Private>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
