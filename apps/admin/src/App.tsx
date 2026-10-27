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
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [connectionState, setConnectionState] = useState<'live' | 'connecting' | 'offline'>('connecting');
  const [announcement, setAnnouncement] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ember_admin_sound') !== 'false';
  });

  type ThemeChoice = 'system' | 'light' | 'dark';
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(() => {
    const saved = localStorage.getItem('ff-admin-theme') || localStorage.getItem('ember_theme');
    if (saved === 'system' || saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Global '/' keyboard listener for search (design.md §4.4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Synchronize theme token with matchMedia live listener
  useEffect(() => {
    localStorage.setItem('ff-admin-theme', themeChoice);

    const applyTheme = () => {
      let resolved = themeChoice;
      if (themeChoice === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolved);
    };

    applyTheme();

    if (themeChoice === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [themeChoice]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text)',
                margin: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {pageTitles[location.pathname] || 'Admin Panel'}
            </h1>
          </div>

          {/* Search bar with / keyboard shortcut */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                navigate(`/orders?search=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: 320,
              margin: '0 auto 0 16px',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-subtle)',
                pointerEvents: 'none',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon name="search" size={16} />
            </span>
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search... (Press /)"
              style={{
                width: '100%',
                height: 40,
                padding: '0 36px 0 34px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                background: 'var(--bg-sunken)',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <kbd>/</kbd>
            </span>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            {/* Live Connection Pill with 2s pulse */}
            <div
              className="badge"
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
                borderRadius: 'var(--r-pill)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
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

            {/* Notification Bell with unread placed orders counter */}
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="btn btn-ghost"
              style={{ width: 40, height: 40, padding: 0, position: 'relative' }}
              title={`${placedCount} orders pending`}
              aria-label="Order notifications"
            >
              <Icon name="bell" size={18} />
              {placedCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 'var(--r-pill)',
                    background: 'var(--danger-solid)',
                    color: 'var(--on-danger)',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                    padding: '0 3px',
                  }}
                >
                  {placedCount}
                </span>
              )}
            </button>

            {/* Sound Alert Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="btn btn-ghost"
              style={{ width: 40, height: 40, padding: 0 }}
              title={soundEnabled ? 'Alert chime active (click to mute)' : 'Alert chime muted'}
              aria-label="Toggle alert chime"
            >
              <Icon name={soundEnabled ? 'volume-2' : 'volume-x'} size={18} />
            </button>

            {/* User Avatar Menu Popover Container */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 10px',
                  background: 'var(--bg-sunken)',
                  borderRadius: 'var(--r-pill)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  color: 'inherit',
                }}
                aria-label="User profile and theme menu"
                aria-expanded={showUserMenu}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--action-bg)',
                    color: 'var(--action-fg)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, textAlign: 'left' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                    {user?.name?.split(' ')[0] || 'Admin'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {user?.role || 'Staff'}
                  </span>
                </div>
                <Icon name="chevron-down" size={14} style={{ color: 'var(--text-subtle)' }} />
              </button>

              {/* Avatar Popover Menu */}
              {showUserMenu && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-dropdown)' }}
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: 220,
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)',
                      boxShadow: 'var(--shadow-2)',
                      padding: 12,
                      zIndex: 'calc(var(--z-dropdown) + 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                        {user?.name || 'Administrator'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'capitalize' }}>
                        Role: {user?.role || 'Staff'}
                      </div>
                    </div>

                    <div style={{ height: 1, background: 'var(--border)' }} />

                    {/* 3-Choice Theme Switcher */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                        Theme
                      </div>
                      <div
                        role="radiogroup"
                        aria-label="Theme selection"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: 2,
                          padding: 3,
                          background: 'var(--bg-sunken)',
                          borderRadius: 'var(--r-sm)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {(['system', 'light', 'dark'] as const).map((choice) => (
                          <button
                            key={choice}
                            role="radio"
                            aria-checked={themeChoice === choice}
                            onClick={() => setThemeChoice(choice)}
                            style={{
                              height: 28,
                              borderRadius: 'var(--r-xs)',
                              border: 'none',
                              background: themeChoice === choice ? 'var(--bg-surface)' : 'transparent',
                              color: themeChoice === choice ? 'var(--action-bg)' : 'var(--text-muted)',
                              fontSize: 11,
                              fontWeight: themeChoice === choice ? 700 : 500,
                              cursor: 'pointer',
                              display: 'grid',
                              placeItems: 'center',
                              textTransform: 'capitalize',
                              boxShadow: themeChoice === choice ? 'var(--shadow-1)' : 'none',
                            }}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ height: 1, background: 'var(--border)' }} />

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleSignOut();
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{
                        justifyContent: 'flex-start',
                        color: 'var(--danger)',
                        gap: 8,
                        padding: '6px 8px',
                      }}
                    >
                      <Icon name="out" size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
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
          themeChoice={themeChoice}
          onSetThemeChoice={setThemeChoice}
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
