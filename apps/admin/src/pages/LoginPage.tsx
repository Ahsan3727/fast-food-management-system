import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/admin.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Icon } from '@/components/Icon';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAdminStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      
      // Verify user identity and role before storing any tokens
      let user = data.user;
      if (!user) {
        const meRes = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
        user = meRes.data.user;
      }

      if (!user || !['admin', 'staff'].includes(user.role)) {
        setErrorMessage('This account cannot sign in here. Admin or staff only.');
        return;
      }

      setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user,
      });

      toast.success(`Welcome back, ${user.name}`);
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Wrong phone, email or password.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg-page)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--r-lg)',
              background: 'var(--chip-bg)',
              color: 'var(--action-bg)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-1)',
            }}
          >
            <Icon name="flame" size={36} />
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--text)',
              marginTop: 'var(--space-3)',
              letterSpacing: '-0.5px',
            }}
          >
            FastFood
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
            Admin Panel — Staff Access Only
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleLogin}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            boxShadow: 'var(--shadow-2)',
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Sign In</h2>

          {errorMessage && (
            <div
              role="alert"
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid var(--danger)',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Icon name="alert" size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="input-group">
            <label className="label" htmlFor="login-identifier">
              Phone or Email
            </label>
            <input
              id="login-identifier"
              className="input"
              placeholder="+923001111111"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              required
              style={{ fontSize: 16 }}
            />
          </div>

          <div className="input-group">
            <label className="label" htmlFor="login-password">
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ fontSize: 16, paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                style={{
                  position: 'absolute',
                  right: 8,
                  background: 'none',
                  border: 'none',
                  padding: 8,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px 0',
              fontSize: 15,
              fontWeight: 700,
              minHeight: 44,
            }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
