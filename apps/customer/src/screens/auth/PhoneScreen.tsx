import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Icon } from '@/components/Icon';

export default function PhoneScreen() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = phone.replace(/\s/g, '').length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      const normalized = phone.startsWith('+') ? phone : `+92${phone.replace(/^0/, '')}`;
      const { data } = await api.post('/auth/otp/send', { phone: normalized });
      navigate('/auth/otp', { state: { phone: normalized, devCode: data.code } });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not send code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
      padding: '24px 20px',
    }}>
      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🍔</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          FastFood
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '6px 0 0' }}>
          Fresh, fast, and delivered
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--bg-surface)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border)',
        padding: '28px 24px',
        boxShadow: 'var(--shadow-2)',
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
          Enter your phone number
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px' }}>
          We'll send you a 6-digit verification code
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 15,
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}>
              <Icon name="phone" size={16} />
            </span>
            <input
              type="tel"
              className="input"
              placeholder="03001234567 or +923001234567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ paddingLeft: 40 }}
              autoFocus
              autoComplete="tel"
              inputMode="tel"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !isValid}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? 'Sending…' : <>Continue <Icon name="right" size={16} /></>}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-subtle)', textAlign: 'center', marginTop: 20 }}>
          By continuing you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
