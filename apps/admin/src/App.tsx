import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useAdminStore, selectIsAuthenticated } from '@/store/admin.store';
import api, { SOCKET_URL, refreshAccessToken } from '@/lib/api';
import { unlockAudio, playOrderChime } from '@/lib/alerts';
import { Icon } from '@/components/Icon';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { PageSkeleton } from '@/components/ui/Skeleton';

// Route-level code splitting (Gate G9)
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const MenuPage = lazy(() => import('@/pages/MenuPage'));
const RidersPage = lazy(() => import('@/pages/RidersPage'));
const CustomersPage = lazy(() => import('@/pages/CustomersPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));

function Private() {
  const store = useAdminStore();
  const isAuthenticated = selectIsAuthenticated(store);
  const { bootStatus } = store;

  if (bootStatus === 'booting') {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--bg-page)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--r-lg)',
              background: 'var(--chip-bg)',
              color: 'var(--action-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-2)',
            }}
          >
            <Icon name="flame" size={30} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            Verifying Session…
          </p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />;
}

function AdminLayout() {
  const { user, accessToken, logout } = useAdminStore();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef<Socket | null>(null);

  const [connectionState, setConnectionState] = useState<'live' | 'connecting' | 'offline'>('connecting');
  const [announcement, setAnnouncement] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ember_admin_sound') !== 'false';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('ember_theme') as 'dark' | 'light') || 'dark';
  });

  // Query for placed orders count needing action
  const { data: placedCount = 0 } = useQuery<number>({
    queryKey: ['orders-placed-count'],
    queryFn: async () => {
      try {
        const res = await api.get('/orders?status=PLACED&limit=50');
        const list = res.data?.items ?? res.data?.orders ?? (Array.isArray(res.data) ? res.data : []);
        return list.length;
      } catch {
        return 0;
      }
    },
    staleTime: 15_000,
  });

  // Synchronize document title with orders needing action (spec §5.3)
  useEffect(() => {
    if (placedCount > 0) {
      document.title = `(${placedCount}) FastFood Admin`;
    } else {
      document.title = 'FastFood Admin';
    }
  }, [placedCount]);

  // Synchronize theme token
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ember_theme', theme);
  }, [theme]);

  // Global user click unlock for browser audio autoplay
  useEffect(() => {
    const handleFirstGesture = () => {
      unlockAudio();
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  const toggleSound = async () => {
    await unlockAudio();
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('ember_admin_sound', String(next));
      if (next) playOrderChime();
      return next;
    });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSignOut = async () => {
    try {
      socketRef.current?.disconnect();
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      qc.clear();
      logout();
      navigate('/login');
    }
  };

  // Real-time socket events
  useEffect(() => {
    if (!accessToken) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionState('live');
    });

    socket.on('disconnect', () => {
      setConnectionState('offline');
    });

    socket.on('reconnecting', () => {
      setConnectionState('connecting');
    });

    socket.on('order:new', (order: any) => {
      if (soundEnabled) {
        playOrderChime();
      }
      const orderNum = order?.orderNumber || 'New';
      const totalFormatted = ((order?.totalPaisa || 0) / 100).toLocaleString('en-PK');
      const msg = `New Order #${orderNum} — Rs. ${totalFormatted}`;
      
      setAnnouncement(msg);
      toast.success(msg, {
        duration: 6000,
      });

      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders-placed-count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    });

    socket.on('order:status_update', () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders-placed-count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    });

    socket.on('order:status', () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders-placed-count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
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
    <div className="admin-layout">
      {/* Skip to Content Link (WCAG 2.4.1) */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Screen Reader Live Region for Announcements (WCAG 4.1.3) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Desktop & Tablet Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text)',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {pageTitles[location.pathname] || 'Admin Panel'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Live Connection Pill */}
            <div
              className={`badge animate-fade-in`}
              style={{
                background:
                  connectionState === 'live'
                    ? 'var(--success-bg)'
                    : connectionState === 'connecting'
                    ? 'var(--warning-bg)'
                    : 'var(--danger-bg)',
                color:
                  connectionState === 'live'
                    ? 'var(--success)'
                    : connectionState === 'connecting'
                    ? 'var(--warning)'
                    : 'var(--danger)',
                border: '1px solid currentColor',
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.4px',
              }}
              role="status"
              aria-label={`Connection status: ${connectionState}`}
            >
              <span
                className={connectionState === 'live' ? 'animate-pulse' : ''}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'currentColor',
                }}
              />
              <span>{connectionState.toUpperCase()}</span>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="btn btn-ghost"
              style={{ width: 38, height: 38, padding: 0 }}
              title={soundEnabled ? 'Alert chime active (click to mute)' : 'Alert chime muted'}
              aria-label="Toggle alert chime"
            >
              <Icon name={soundEnabled ? 'volume-2' : 'volume-x'} size={18} />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-ghost"
              style={{ width: 38, height: 38, padding: 0 }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>

            {/* User Profile Capsule */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                background: 'var(--bg-sunken)',
                borderRadius: 'var(--r-pill)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'var(--action-bg)',
                  color: 'var(--action-fg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                  {user?.name?.split(' ')[0] || 'Admin'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {user?.role || 'Staff'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Offline Banner if disconnected */}
        {connectionState === 'offline' && (
          <div
            role="status"
            style={{
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              borderBottom: '1px solid var(--warning)',
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Icon name="wifi-off" size={16} />
            <span>Connection lost. Reconnecting to live server…</span>
          </div>
        )}

        {/* Dynamic Route Content */}
        <main id="main-content" className="admin-content" tabIndex={-1}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>

        {/* Mobile Navigation Bar (< 768px) */}
        <MobileNav
          theme={theme}
          onToggleTheme={toggleTheme}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      </div>
    </div>
  );
}

export default function App() {
  const { refreshToken, setUser, logout, setBootStatus } = useAdminStore();

  // Boot: Single-flight refresh token check
  useEffect(() => {
    let active = true;

    async function initializeSession() {
      if (!refreshToken) {
        setBootStatus('ready');
        return;
      }

      try {
        const token = await refreshAccessToken();
        if (token && active) {
          const res = await api.get('/users/me');
          const meUser = res.data?.user;
          if (meUser && ['admin', 'staff'].includes(meUser.role)) {
            setUser(meUser);
          } else {
            logout();
          }
        }
      } catch {
        if (active) logout();
      } finally {
        if (active) setBootStatus('ready');
      }
    }

    initializeSession();
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route path="/" element={<Private />}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrdersPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="riders" element={<RidersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
