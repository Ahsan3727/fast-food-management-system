import { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface Props {
  /** Shown while offline. Default suits the orders screens; the menu passes its own. */
  offlineMessage?: string;
}

const DEFAULT_OFFLINE_MESSAGE = "You're offline — showing your last orders";

export function ConnectionBanner({ offlineMessage = DEFAULT_OFFLINE_MESSAGE }: Props) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      clearTimeout(hideTimer.current);
      // hides after 2.2s per design.md §4.6. (The timer used to be created inside
      // the event handler, so its cleanup was returned to nobody and never ran.)
      hideTimer.current = setTimeout(() => setShowBackOnline(false), 2200);
    };

    const handleOffline = () => {
      clearTimeout(hideTimer.current);
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(hideTimer.current);
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
        // solid + matching foreground so white-on-light-red never happens in dark theme
        background: isSuccess ? 'var(--success)' : 'var(--danger-solid)',
        color: isSuccess ? 'var(--on-success)' : 'var(--on-danger)',
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
      <span>{isSuccess ? 'Back online' : offlineMessage}</span>
    </div>
  );
}
