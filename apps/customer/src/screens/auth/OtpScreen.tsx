import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Icon } from '@/components/Icon';

interface LocationState {
  phone: string;
  devCode?: string; // only present in dev mode
}

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OtpScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const { setTokens, setUser } = useAuthStore();

  // Guard — if landed here directly without phone, go back
  if (!state?.phone) {
    navigate('/auth/phone', { replace: true });
    return null;
  }

  const { phone, devCode } = state;

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null); // null = unknown yet
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Pre-fill dev OTP
  useEffect(() => {
    if (devCode && devCode.length === CODE_LENGTH) {
      setDigits(devCode.split(''));
    }
  }, [devCode]);

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  // Auto-submit when all digits are filled
  const code = digits.join('');
  useEffect(() => {
    if (code.length === CODE_LENGTH && !loading) {
      handleVerify(code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (pasted.length === CODE_LENGTH) {
      setDigits(pasted.split(''));
      inputRefs.current[CODE_LENGTH - 1]?.focus();
    }
  };

  const handleVerify = async (codeToVerify: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const payload: any = { phone, code: codeToVerify };
      // Only send name if it's a new-user flow and name has been entered
      if (isNewUser && name.trim().length >= 2) payload.name = name.trim();

      const { data } = await api.post('/auth/otp/verify', payload);

      if (data.isNewUser && !name.trim()) {
        // API says it's a new user — ask for name, reset digits
        setIsNewUser(true);
        setDigits(Array(CODE_LENGTH).fill(''));
        setLoading(false);
        toast('Welcome! Please enter your name to finish setting up your account.', { icon: '👋' });
        return;
      }

      setTokens(data.accessToken, data.refreshToken);
      const me = await api.get('/users/me');
      setUser(me.data.user);
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Verification failed. Try again.');
      setDigits(Array(CODE_LENGTH).fill(''));
      setLoading(false);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { data } = await api.post('/auth/otp/send', { phone });
      setResendTimer(RESEND_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(''));
      if (data.code) setDigits(data.code.split(''));
      toast.success('New code sent!');
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not resend. Try again.');
    } finally {
      setResending(false);
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
      {/* Back */}
      <div style={{ width: '100%', maxWidth: 400, marginBottom: 16 }}>
        <button
          onClick={() => navigate('/auth/phone')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
        >
          <Icon name="left" size={16} /> Back
        </button>
      </div>

      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🍔</div>
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
          Verify your number
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px' }}>
          Enter the 6-digit code sent to <strong>{phone}</strong>
        </p>

        {/* Name input — only shown for new users */}
        {isNewUser && (
          <div style={{ marginBottom: 20 }}>
            <label className="label">Your Name</label>
            <input
              className="input"
              placeholder="Ahsan Ali"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 6 }}>
              First time here! Enter your name to create your account.
            </p>
          </div>
        )}

        {/* OTP digit inputs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={{
                width: 46,
                height: 54,
                textAlign: 'center',
                fontSize: 22,
                fontWeight: 700,
                border: `2px solid ${d ? 'var(--action-bg)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                background: 'var(--bg-surface)',
                color: 'var(--text)',
                outline: 'none',
                transition: 'border-color var(--dur-fast)',
              }}
            />
          ))}
        </div>

        {/* Verify button (shown only for new-user name flow) */}
        {isNewUser && (
          <button
            className="btn-primary"
            disabled={loading || name.trim().length < 2}
            onClick={() => handleVerify(code)}
            style={{ marginBottom: 16 }}
          >
            {loading ? 'Verifying…' : 'Create Account'}
          </button>
        )}

        {/* Resend */}
        <div style={{ textAlign: 'center' }}>
          {resendTimer > 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Resend code in <strong>{resendTimer}s</strong>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{ background: 'none', border: 'none', color: 'var(--action-bg)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
