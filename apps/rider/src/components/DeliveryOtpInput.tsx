import React, { useRef, useEffect } from 'react';

interface DeliveryOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
}

export function DeliveryOtpInput({
  value,
  onChange,
  error,
  disabled = false,
}: DeliveryOtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange(raw);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <label
        htmlFor="delivery-otp"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--muted)',
          display: 'block',
        }}
      >
        Customer 6-Digit Delivery Code *
      </label>

      <div style={{ position: 'relative', width: '100%' }}>
        <input
          ref={inputRef}
          id="delivery-otp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="••••••"
          aria-invalid={!!error}
          aria-describedby={error ? 'otp-error-msg' : undefined}
          style={{
            width: '100%',
            height: 56,
            borderRadius: 'var(--radius-md)',
            border: error ? '2px solid var(--danger)' : '1.5px solid var(--border-strong)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 28,
            lineHeight: '36px',
            fontWeight: 800,
            fontFamily: 'monospace, monospace',
            letterSpacing: '0.4em',
            textAlign: 'center',
            outline: 'none',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
            transition: 'border-color var(--dur-fast)',
          }}
        />
      </div>

      {error && (
        <p
          id="otp-error-msg"
          role="alert"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--danger)',
            margin: '2px 0 0',
            lineHeight: 1.4,
          }}
        >
          {error}
        </p>
      )}

      <p style={{ fontSize: 12, color: 'var(--subtle)', margin: 0 }}>
        Ask the customer to show the 6-digit code on their order tracking screen.
      </p>
    </div>
  );
}
