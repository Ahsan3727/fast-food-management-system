import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { initPush } from '@/lib/push';
import { Icon } from '@/components/Icon';
import styles from './OtpModal.module.css';

interface Props {
  isOpen: boolean;
  phone: string;
  name?: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function OtpModal({
  isOpen,
  phone: initialPhone,
  name,
  title = 'Verify Your Phone',
  subtitle = 'We will send a 6-digit verification code to confirm your phone number.',
  onClose,
  onSuccess,
}: Props) {
  const { setTokens, setUser, setCustomerProfile } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'code'>(initialPhone ? 'code' : 'phone');
  const [phone, setPhone] = useState(initialPhone || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Sync phone when opened
  useEffect(() => {
    if (isOpen) {
      setPhone(initialPhone || '');
      setCode('');
      setStep(initialPhone ? 'code' : 'phone');
    }
  }, [isOpen, initialPhone]);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus code input when entering code step
  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [step]);

  if (!isOpen) return null;

  const handleRequestOtp = async (targetPhone = phone) => {
    const cleanPhone = targetPhone.trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/request', { phone: cleanPhone });
      setCooldown(data.cooldownSeconds || 60);
      setStep('code');
      toast.success('Verification code sent!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/verify', {
        phone: phone.trim(),
        code: cleanCode,
        name: name?.trim() || undefined,
      });

      setTokens(data.accessToken, data.refreshToken);
      if (data.user) setUser(data.user);
      setCustomerProfile({
        name: data.user?.name || name || 'Customer',
        phone: phone.trim(),
      });

      // Wire push notification token upon successful auth (Phase 4)
      void initPush();

      toast.success('Phone verified successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.scrim} onClick={onClose} aria-hidden="true">
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="minus" size={16} />
          </button>
        </div>

        <p className={styles.subtitle}>
          {step === 'phone'
            ? subtitle
            : `Enter the 6-digit code sent to ${phone}`}
        </p>

        {step === 'phone' ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              void handleRequestOtp();
            }}
            className={styles.inputGroup}
          >
            <label className={styles.label} htmlFor="otp-phone">
              Phone Number
            </label>
            <input
              id="otp-phone"
              type="tel"
              className={styles.input}
              placeholder="03001234567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoFocus
              required
            />
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !phone.trim()}
            >
              {loading ? 'Sending code…' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              void handleVerifyOtp();
            }}
            className={styles.inputGroup}
          >
            <label className={styles.label} htmlFor="otp-code">
              6-Digit Code
            </label>
            <input
              id="otp-code"
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className={`${styles.input} ${styles.codeInput}`}
              placeholder="······"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />

            <div className={styles.resendRow}>
              <button
                type="button"
                className={styles.textBtn}
                onClick={() => setStep('phone')}
              >
                Change Phone
              </button>
              <button
                type="button"
                className={styles.textBtn}
                disabled={cooldown > 0 || loading}
                onClick={() => handleRequestOtp()}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || code.trim().length !== 6}
            >
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
