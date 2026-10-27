import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRiderAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Icon } from '@/components/Icon';
import RiderBottomNav from '@/components/RiderBottomNav';
import { ConnectionBanner } from '@/components/ConnectionBanner';

type ThemeChoice = 'system' | 'light' | 'dark';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { rider, logout } = useRiderAuthStore();

  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(() => {
    const saved = localStorage.getItem('ff-rider-theme') || localStorage.getItem('ember_rider_theme');
    if (saved === 'system' || saved === 'light' || saved === 'dark') return saved;
    return 'system';
  });

  useEffect(() => {
    localStorage.setItem('ff-rider-theme', themeChoice);

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

  const initial = rider?.name?.[0]?.toUpperCase() ?? 'R';

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
      {/* Network Connectivity Banner */}
      <ConnectionBanner />

      <div style={{ flex: 1, padding: '24px 20px', overflowY: 'auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 20px', color: 'var(--text)' }}>
          Rider Profile
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
              background: 'var(--tint-bg)',
              color: 'var(--action)',
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
              {rider?.name || 'Rider'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--subtle)', margin: '2px 0 0' }}>
              {rider?.phone || 'Delivery Partner'}
            </p>
          </div>
        </div>

        {/* Actions Menu */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          {/* Earnings link */}
          <button
            onClick={() => navigate('/earnings')}
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
              <Icon name="cash" size={18} style={{ color: 'var(--action)' }} />
              <span>Earnings History & Ledger</span>
            </div>
            <Icon name="right" size={16} style={{ color: 'var(--subtle)' }} />
          </button>

          {/* 3-Choice Theme Switcher Segmented Control */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="sun" size={18} style={{ color: 'var(--muted)' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  Theme Appearance
                </span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--subtle)', textTransform: 'capitalize' }}>
                {themeChoice}
              </span>
            </div>

            <div
              role="radiogroup"
              aria-label="Theme selection"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 4,
                padding: 4,
                background: 'var(--sunken)',
                borderRadius: 'var(--radius-md, 10px)',
                border: '1px solid var(--border)',
              }}
            >
              {(['system', 'light', 'dark'] as const).map(choice => {
                const active = themeChoice === choice;
                return (
                  <button
                    key={choice}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setThemeChoice(choice)}
                    style={{
                      height: 36,
                      borderRadius: 8,
                      border: 'none',
                      background: active ? 'var(--surface)' : 'transparent',
                      color: active ? 'var(--action)' : 'var(--muted)',
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease',
                      textTransform: 'capitalize',
                    }}
                  >
                    <Icon
                      name={choice === 'dark' ? 'moon' : choice === 'light' ? 'sun' : 'sparkle'}
                      size={14}
                    />
                    <span>{choice}</span>
                  </button>
                );
              })}
            </div>
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

        <p style={{ fontSize: 12, color: 'var(--subtle)', textAlign: 'center' }}>
          FastFood Rider Portal · Ember Design System v1.0
        </p>
      </div>

      <RiderBottomNav active="profile" />
    </div>
  );
}
