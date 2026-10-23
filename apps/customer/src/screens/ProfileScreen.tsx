import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import BottomNav from '@/components/BottomNav';
import { Icon } from '@/components/Icon';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const {
    user,
    customerName,
    customerPhone,
    defaultAddress,
    setCustomerProfile,
    logout,
    isAuthenticated,
  } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();


  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(customerName || user?.name || '');
  const [phoneInput, setPhoneInput] = useState(customerPhone || user?.phone || '');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/me').then(r => r.data.user),
    enabled: isAuthenticated,
  });

  const displayUser = profile ?? user;
  const currentName = customerName || displayUser?.name || 'Guest Customer';
  const currentPhone = customerPhone || displayUser?.phone || 'No phone set';
  const initial = currentName[0]?.toUpperCase() ?? 'C';

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) {
      toast.error('Please enter a name');
      return;
    }
    setCustomerProfile({
      name: nameInput.trim(),
      phone: phoneInput.trim(),
    });

    if (isAuthenticated) {
      try {
        await api.patch('/users/me', { name: nameInput.trim() });
      } catch {
        // saved locally
      }
    }
    setIsEditing(false);
    toast.success('Details updated!');
  };

  const handleClearData = async () => {
    if (confirm('Clear saved customer details and order history from this device?')) {
      try {
        if (isAuthenticated) await api.post('/auth/logout');
      } catch {
        // ignore
      } finally {
        logout();
        setCustomerProfile({ name: '', phone: '', defaultAddress: '' });
        setNameInput('');
        setPhoneInput('');
        toast.success('Saved data cleared');
      }
    }
  };

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
              {currentName}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--subtle)', margin: '2px 0 0' }}>
              {currentPhone}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNameInput(currentName === 'Guest Customer' ? '' : currentName);
              setPhoneInput(currentPhone === 'No phone set' ? '' : currentPhone);
              setIsEditing(!isEditing);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--sunken)',
              color: 'var(--text)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              marginBottom: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              Update Saved Details
            </h3>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                Your Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Full Name"
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="03001234567"
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleSaveProfile}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'var(--action)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Save Details
            </button>
          </div>
        )}

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

          {/* Clear Saved Data */}
          <button
            onClick={handleClearData}
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
            <Icon name="trash" size={18} />
            <span>Clear Saved Data</span>
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
