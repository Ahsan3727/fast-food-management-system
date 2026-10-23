import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Icon, IconName } from '@/components/Icon';
import { QK } from '@/api/queryKeys';
import { STATUS_META, OrderStatus } from '@fastfood/shared-types';

interface Props {
  active: 'home' | 'menu' | 'orders' | 'profile';
}

interface NavItem {
  key: Props['active'];
  label: string;
  icon: IconName;
  path: string;
}

const items: NavItem[] = [
  { key: 'home',    label: 'Home',    icon: 'home',     path: '/' },
  { key: 'menu',    label: 'Menu',    icon: 'utensils', path: '/menu' },
  { key: 'orders',  label: 'Orders',  icon: 'receipt',  path: '/orders' },
  { key: 'profile', label: 'Profile', icon: 'user',     path: '/profile' },
];

export default function BottomNav({ active }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Read from existing cache — no independent fetch (WP4: eliminates duplicate polling)
  const myOrders: any[] = qc.getQueryData(QK.myOrders) ?? [];
  const hasActiveOrders = myOrders.some(
    (o) => STATUS_META[o.status as OrderStatus]?.isActive,
  );

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        zIndex: 20,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
      }}
    >
      {items.map((item) => {
        const isCurrent = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            aria-current={isCurrent ? 'page' : undefined}
            aria-label={item.label}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              height: '100%',
              background: 'none',
              border: 'none',
              fontSize: 10,
              fontWeight: isCurrent ? 700 : 500,
              color: isCurrent ? 'var(--action-bg)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: 0,
              transition: 'color var(--dur-fast)',
            }}
          >
            {/* Active indicator bar */}
            {isCurrent && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '25%',
                  right: '25%',
                  height: 2,
                  borderRadius: '0 0 2px 2px',
                  background: 'var(--action-bg)',
                }}
              />
            )}

            <div style={{ position: 'relative' }}>
              <Icon
                name={item.icon}
                size={22}
                style={{ color: isCurrent ? 'var(--action-bg)' : 'var(--text-muted)' }}
              />
              {/* Active orders dot */}
              {item.key === 'orders' && hasActiveOrders && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -4,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--action-bg)',
                  }}
                  aria-hidden="true"
                />
              )}
            </div>

            <span style={{ fontSize: 10, lineHeight: 1 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
