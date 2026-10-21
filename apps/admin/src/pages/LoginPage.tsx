import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/admin.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAdminStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      setTokens(data.accessToken, data.refreshToken);
      const me = await api.get('/users/me');
      if (!['admin', 'staff'].includes(me.data.user.role)) {
        toast.error('Access denied — admin or staff only');
        return;
      }
      setUser(me.data.user);
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 64 }}>🍔</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginTop: 8 }}>FastFood</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Admin Panel — Staff Access Only</p>
        </div>

        <form onSubmit={handleLogin} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Sign In</h2>

          <div className="input-group">
            <label className="label">Phone or Email</label>
            <input className="input" placeholder="+923001111111" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
          </div>

          <div className="input-group">
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: 15 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
