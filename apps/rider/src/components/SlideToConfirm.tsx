import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './Icon';

interface SlideToConfirmProps {
  label: string;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'action' | 'success';
}

export function SlideToConfirm({
  label,
  onConfirm,
  loading = false,
  disabled = false,
  variant = 'action',
}: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [completed, setCompleted] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);

  const thumbSize = 52;
  const padding = 4; // 4px margin inside the 60px track

  const getMaxTravel = useCallback(() => {
    if (!trackRef.current) return 0;
    return Math.max(0, trackRef.current.clientWidth - thumbSize - padding * 2);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || loading || completed) return;
    setIsDragging(true);
    isDraggingRef.current = true;
    startXRef.current = e.clientX - dragX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const maxTravel = getMaxTravel();
    if (maxTravel <= 0) return;

    const newX = Math.min(Math.max(0, e.clientX - startXRef.current), maxTravel);
    setDragX(newX);

    // If dragged past 85% of total travel, complete immediately
    if (newX >= maxTravel * 0.85) {
      triggerConfirm();
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    const maxTravel = getMaxTravel();
    if (dragX < maxTravel * 0.85 && !completed) {
      // Snap back smoothly in 220ms
      setDragX(0);
    }
  };

  const triggerConfirm = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    const maxTravel = getMaxTravel();
    setDragX(maxTravel);
    setCompleted(true);
    try {
      if (navigator.vibrate) navigator.vibrate(50);
    } catch {
      // ignore
    }
    onConfirm();
  }, [getMaxTravel, onConfirm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || loading || completed) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerConfirm();
    }
  };

  // Reset if disabled or after loading completes
  useEffect(() => {
    if (!loading && completed) {
      const t = setTimeout(() => {
        setCompleted(false);
        setDragX(0);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [loading, completed]);

  const maxTravel = getMaxTravel();
  const progressPct = maxTravel > 0 ? Math.round((dragX / maxTravel) * 100) : 0;
  const thumbBg = variant === 'success' ? 'var(--ok)' : 'var(--action)';

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={disabled || loading ? -1 : 0}
      aria-label={`${label}. Drag to the end, or press Enter.`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progressPct}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        width: '100%',
        height: 60,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--sunken)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        outline: 'none',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {/* Dynamic Fill Progress Behind Thumb */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: dragX + thumbSize / 2,
          background: variant === 'success' ? 'var(--ok-bg)' : 'var(--tint-bg)',
          opacity: 0.6,
          transition: isDragging ? 'none' : 'width 220ms var(--ease-standard)',
        }}
      />

      {/* Centered Instructions Label */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: dragX > 80 ? 'var(--text-muted)' : 'var(--text)',
          pointerEvents: 'none',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'opacity 0.2s',
          opacity: loading ? 0.3 : 1,
        }}
      >
        <span>{loading ? 'Confirming...' : label}</span>
        {!loading && <Icon name="right" size={16} style={{ color: 'var(--subtle)' }} />}
      </div>

      {/* Draggable 52px Round Thumb */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'absolute',
          left: padding,
          top: padding,
          width: thumbSize,
          height: thumbSize,
          borderRadius: '50%',
          background: thumbBg,
          color: '#ffffff',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 2,
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 220ms var(--ease-standard)',
        }}
      >
        {loading ? (
          <div
            style={{
              width: 20,
              height: 20,
              border: '2.5px solid rgba(255,255,255,0.3)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        ) : (
          <Icon name={completed ? 'check' : 'right'} size={24} />
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
