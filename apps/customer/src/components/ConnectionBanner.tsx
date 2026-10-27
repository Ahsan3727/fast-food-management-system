import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

export function ConnectionBanner() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
      }, 2200); // hides after 2.2s per design.md §4.6
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showBackOnline) {
    return null;
  }

  const isSuccess = isOnline && showBackOnline;

  return (
    <div
      role="status"
      style={{
        width: '100%',
        padding: '10px 16px',
        background: isSuccess ? 'var(--ok, #15803D)' : 'var(--bad, #B91C1C)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 700,
        zIndex: 50,
        boxShadow: 'var(--shadow-2, 0 4px 12px rgba(0,0,0,0.15))',
        animation: 'customerBannerSlideDown 200ms ease-out',
      }}
    >
      <Icon name={isSuccess ? 'check' : 'ban'} size={16} />
      <span>
        {isSuccess
          ? 'Back online'
          : "You're offline — showing your last orders"}
      </span>

      <style>{`
        @keyframes customerBannerSlideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
