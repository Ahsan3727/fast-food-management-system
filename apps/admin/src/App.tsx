import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/admin.store';
import api, { SOCKET_URL } from '@/lib/api';
import { Icon } from '@/components/Icon';

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

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // blocked until user gesture or unsupported
  }
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAdminStore();
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const location = useLocation();

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ember_admin_sound') !== 'false';
  });

  const [isLive, setIsLive] = useState<boolean>(false);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('ember_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ember_theme', theme);
  }, [theme]);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('ember_admin_sound', String(next));
      if (next) playChime();
      return next;
    });
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Real-time socket events
  useEffect(() => {
    if (!accessToken) return;
    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsLive(true));
    socket.on('disconnect', () => setIsLive(false));

    socket.on('order:new', (order: any) => {
      if (soundEnabled) {
        playChime();
      }
      toast.success(
        `New Order #${order.orderNumber} placed — Rs. ${((order.totalPaisa || 0) / 100).toFixed(0)}`,
        {
          duration: 6000,
          style: {
            background: 'var(--action)',
            color: '#fff',
            fontWeight: 700,
            borderRadius: '12px',
          },
        }
      );
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    });

    socket.on('order:status_update', () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, qc, soundEnabled]);

  const pageTitles: Record<string, string> = {
    '/': 'Live Operations Board',
    '/orders': 'Order Management',
    '/menu': 'Menu & Inventory',
    '/riders': 'Fleet & Dispatch',
    '/customers': 'Customer Directory',
    '/analytics': 'Performance Analytics',
  };

  return (
    <div className="admin-layout" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar currentPath={location.pathname} />
      <div className="admin-main" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <header
          className="admin-header"
          style={{
            height: 64,
            padding: '0 24px',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {pageTitles[location.pathname] || 'Admin'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Live Socket Indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                borderRadius: 999,
                background: isLive ? 'var(--ok-bg)' : 'var(--bad-bg)',
                color: isLive ? 'var(--ok)' : 'var(--bad)',
                fontSize: 12,
                fontWeight: 600,
              }}
              title={isLive ? 'Real-time WebSocket active' : 'Connecting to live server...'}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'currentColor',
                  boxShadow: isLive ? '0 0 6px currentColor' : 'none',
                }}
              />
              <span>{isLive ? 'LIVE' : 'OFFLINE'}</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: soundEnabled ? 'var(--sunken)' : 'transparent',
                color: soundEnabled ? 'var(--action)' : 'var(--subtle)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
              title={soundEnabled ? 'Order sound alerts enabled' : 'Order sound alerts muted'}
              aria-label="Toggle sound alerts"
            >
              <Icon name={soundEnabled ? 'volume-2' : 'volume-x'} size={18} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--sunken)',
                color: 'var(--muted)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>

            {/* User Profile */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingLeft: 8,
                borderLeft: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'var(--action)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                  {user?.name || 'Administrator'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--subtle)', textTransform: 'capitalize' }}>
                  {user?.role || 'Manager'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content" style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--bg)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { refreshToken, setTokens, setUser, logout, isAuthenticated } = useAdminStore();

  useEffect(() => {
    if (!refreshToken) return;
    api
      .post('/auth/refresh', { refreshToken })
      .then(({ data }) => {
        setTokens(data.accessToken, data.refreshToken);
        return api.get('/users/me');
      })
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
