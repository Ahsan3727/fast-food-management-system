import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAdminStore } from '@/store/admin.store';
import api from '@/lib/api';
import { Icon } from '@/components/Icon';

interface MobileNavProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function MobileNav({
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
}: MobileNavProps) {
  const navigate = useNavigate();
  const { logout, user } = useAdminStore();
  const [showMore, setShowMore] = useState(false);

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

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`}
        >
          <Icon name="home" size={22} />
          <span>Live</span>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`}
        >
          <Icon name="receipt" size={22} />
          <span>Orders</span>
          {placedCount > 0 && <span className="mobile-tab-badge">{placedCount}</span>}
        </NavLink>

        <NavLink
          to="/menu"
          className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`}
        >
          <Icon name="utensils" size={22} />
          <span>Menu</span>
        </NavLink>

        <NavLink
          to="/riders"
          className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`}
        >
          <Icon name="bike" size={22} />
          <span>Riders</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setShowMore(true)}
          className={`mobile-tab-item ${showMore ? 'active' : ''}`}
          aria-label="More navigation options"
        >
          <Icon name="more" size={22} />
          <span>More</span>
        </button>
      </nav>

      {/* More Options Sheet */}
      {showMore && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More Options"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-overlay)',
            zIndex: 'var(--z-dialog)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setShowMore(false)}
        >
          <div
            className="animate-sheet-up"
            style={{
              background: 'var(--bg-surface)',
              borderTopLeftRadius: 'var(--r-xl)',
              borderTopRightRadius: 'var(--r-xl)',
              padding: 'var(--space-6)',
              paddingBottom: 'calc(var(--space-6) + env(safe-area-inset-bottom, 0px))',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              borderTop: '1px solid var(--border)',
              maxHeight: '80dvh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {user?.name || 'Staff Member'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  Role: {user?.role || 'Staff'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMore(false)}
                aria-label="Close"
                style={{
                  background: 'var(--bg-sunken)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  padding: 8,
                  cursor: 'pointer',
                  color: 'var(--text)',
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <NavLink
                to="/customers"
                onClick={() => setShowMore(false)}
                className="nav-item"
                style={{ padding: '12px 14px' }}
              >
                <Icon name="users" size={20} />
                <span>Customers Directory</span>
              </NavLink>

              <NavLink
                to="/analytics"
                onClick={() => setShowMore(false)}
                className="nav-item"
                style={{ padding: '12px 14px' }}
              >
                <Icon name="chart" size={20} />
                <span>Performance Analytics</span>
              </NavLink>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Theme</span>
              <button
                type="button"
                onClick={onToggleTheme}
                className="btn btn-ghost btn-sm"
                style={{ gap: 6 }}
              >
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
                <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Alert Chime</span>
              <button
                type="button"
                onClick={onToggleSound}
                className="btn btn-ghost btn-sm"
                style={{ gap: 6 }}
              >
                <Icon name={soundEnabled ? 'volume-2' : 'volume-x'} size={16} />
                <span>{soundEnabled ? 'Mute' : 'Enable'}</span>
              </button>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-danger"
              style={{ width: '100%', minHeight: 44, fontWeight: 700 }}
            >
              <Icon name="out" size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
