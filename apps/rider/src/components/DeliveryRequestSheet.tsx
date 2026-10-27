import React, { useEffect, useState, useRef } from 'react';
import { formatMoneyCompact } from '@fastfood/utils';
import { Icon } from './Icon';

interface DeliveryRequestData {
  orderId: string;
  orderNumber: string;
  totalPaisa: number;
  riderPayoutPaisa?: number;
  pickupAddress?: string;
  deliveryAddress?: {
    addressLine: string;
    landmark?: string;
  };
  pickupDistance?: string;
  dropoffDistance?: string;
}

interface DeliveryRequestSheetProps {
  request: DeliveryRequestData;
  onAccept: () => void;
  onDecline: (reason?: string) => void;
  loading?: boolean;
}

export function DeliveryRequestSheet({
  request,
  onAccept,
  onDecline,
  loading = false,
}: DeliveryRequestSheetProps) {
  const [timeLeft, setTimeLeft] = useState(30);
  const totalSeconds = 30;
  const audioPlayedRef = useRef(false);

  // Play audio chime and trigger vibration once on mount
  useEffect(() => {
    if (!audioPlayedRef.current) {
      audioPlayedRef.current = true;

      // Haptic vibration per design.md §4.5 (200-100-200ms)
      try {
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      } catch {
        // ignore
      }

      // Web Audio API ascending dual-tone chime (no external MP3 asset needed)
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch {
        // audio might be blocked before first user gesture
      }
    }
  }, []);

  // 30-second countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onDecline]);

  // Circular timer SVG parameters
  const strokeWidth = 3.5;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalSeconds) * circumference;

  const earningPaisa = request.riderPayoutPaisa ?? 15000;
  const cashPaisa = request.totalPaisa ?? 0;
  const pickupText = request.pickupAddress || 'FastFood Kitchen, Main Boulevard';
  const dropoffText = request.deliveryAddress?.addressLine || 'Customer Delivery Address';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`New delivery request for order #${request.orderNumber}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-overlay)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 40,
        padding: 0,
      }}
    >
      {/* Screen-reader live announcement */}
      <div className="sr-only" aria-live="assertive">
        New delivery request. Order #{request.orderNumber}. Cash to collect {formatMoneyCompact(cashPaisa)}.
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 500,
          maxHeight: '92dvh',
          background: 'var(--bg-surface)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          boxShadow: 'var(--shadow-3)',
          overflowY: 'auto',
          padding: '16px 20px calc(24px + var(--safe-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          animation: 'slideUp 240ms var(--ease-standard)',
        }}
      >
        {/* Grab Handle */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--border-strong)',
            alignSelf: 'center',
            opacity: 0.5,
          }}
        />

        {/* Header & 30s Countdown Ring */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--action)',
              }}
            >
              New delivery request
            </span>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                margin: '2px 0 0',
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              #{request.orderNumber}
            </h2>
          </div>

          {/* SVG Countdown Ring */}
          <div
            role="timer"
            aria-label={`${timeLeft} seconds left`}
            style={{
              position: 'relative',
              width: 52,
              height: 52,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="26"
                cy="26"
                r={radius}
                fill="none"
                stroke="var(--sunken)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="26"
                cy="26"
                r={radius}
                fill="none"
                stroke={timeLeft <= 8 ? 'var(--bad)' : 'var(--action)'}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
              />
            </svg>
            <span
              style={{
                position: 'absolute',
                fontSize: 15,
                fontWeight: 800,
                color: timeLeft <= 8 ? 'var(--bad)' : 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Earnings & Cash Callout Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div
            style={{
              background: 'var(--sunken)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase' }}>
              Your Earning
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--ok)',
                marginTop: 2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              +{formatMoneyCompact(earningPaisa)}
            </div>
          </div>

          <div
            style={{
              background: 'var(--sunken)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase' }}>
              Cash to Collect
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--text)',
                marginTop: 2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatMoneyCompact(cashPaisa)}
            </div>
          </div>
        </div>

        {/* Route Details Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Pickup Step */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--tint-bg)',
                color: 'var(--action)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <Icon name="store" size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase' }}>
                Pickup {request.pickupDistance ? `· ${request.pickupDistance}` : ''}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                {pickupText}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* Dropoff Step */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(29, 78, 216, 0.12)',
                color: 'var(--focus)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <Icon name="pin" size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase' }}>
                Drop-off {request.dropoffDistance ? `· ${request.dropoffDistance}` : ''}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                {dropoffText}
              </div>
            </div>
          </div>
        </div>

        {/* Dual 56px Full-Width Action Buttons per design.md §4.5 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onAccept}
            disabled={loading || timeLeft === 0}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 'var(--radius-md)',
              background: 'var(--action-bg)',
              color: 'var(--action-fg)',
              border: 'none',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-2)',
              transition: 'background var(--dur-fast), transform var(--dur-press)',
            }}
          >
            <Icon name="check" size={20} />
            <span>{loading ? 'Accepting...' : `Accept Delivery · +${formatMoneyCompact(earningPaisa)}`}</span>
          </button>

          <button
            type="button"
            onClick={() => onDecline('declined')}
            disabled={loading}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border-strong)',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background var(--dur-fast)',
            }}
          >
            Decline
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
