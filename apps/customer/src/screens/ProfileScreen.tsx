import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import BottomNav from '@/components/BottomNav';
import { Icon } from '@/components/Icon';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('ember_customer_theme') as 'dark' | 'light') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ember_customer_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/me').then(r => r.data.user),
  });

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const displayUser = profile ?? user;
  const initial = displayUser?.name?.[0]?.toUpperCase() ?? 'U';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div style={{ flex: 1, padding: '24px 20px', overflowY: 'auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 20px', color: 'var(--text)' }}>
          Profile
        </h1>

        {/* User Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 16,
            borderRadius: 16,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#fed7aa',
              color: '#1c1917',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              {displayUser?.name || 'Customer'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--subtle)', margin: '2px 0 0' }}>
              {displayUser?.phone || displayUser?.email || 'Registered Customer'}
            </p>
          </div>
        </div>

        {/* Menu rows */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          {/* My Orders */}
          <button
            onClick={() => navigate('/orders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '16px',
              border: 'none',
              background: 'none',
              color: 'var(--text)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="receipt" size={18} style={{ color: 'var(--action)' }} />
              <span>My Orders</span>
            </div>
            <Icon name="right" size={16} style={{ color: 'var(--subtle)' }} />
          </button>

          {/* Theme switch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} style={{ color: 'var(--muted)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                Dark Theme
              </span>
            </div>

            {/* Accessible toggle switch */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                width: 44,
                height: 26,
                borderRadius: 999,
                background: theme === 'dark' ? 'var(--action)' : 'var(--strong)',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                padding: 0,
              }}
              aria-label="Toggle dark mode"
            >
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  left: theme === 'dark' ? 21 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s cubic-bezier(0.2,0,0,1)',
                }}
              />
            </button>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '16px',
              border: 'none',
              background: 'none',
              color: 'var(--bad)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Icon name="out" size={18} />
            <span>Sign Out</span>
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--subtle)', textAlign: 'center', lineHeight: 1.5, padding: '0 10px' }}>
          FastFood Ember Design System · Clean Architecture
        </p>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
