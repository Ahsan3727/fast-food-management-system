import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Icon, IconName } from '@/components/Icon';
import api from '@/lib/api';
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
  { key: 'home', label: 'Home', icon: 'home', path: '/' },
  { key: 'menu', label: 'Menu', icon: 'utensils', path: '/menu' },
  { key: 'orders', label: 'Orders', icon: 'receipt', path: '/orders' },
  { key: 'profile', label: 'Profile', icon: 'user', path: '/profile' },
];

export default function BottomNav({ active }: Props) {
  const navigate = useNavigate();

  const { data: myOrders = [] } = useQuery<any[]>({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my').then(r => r.data),
    staleTime: 15000,
  });

  const hasActiveOrders = myOrders.some(
    o => STATUS_META[o.status as OrderStatus]?.isActive
  );

  return (
    <nav
      className="bottom-nav"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        height: 56,
      }}
    >
      {items.map(item => {
        const isCurrent = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
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
              fontSize: 12,
              fontWeight: isCurrent ? 700 : 500,
              color: isCurrent ? 'var(--action)' : 'var(--subtle)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {isCurrent && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '25%',
                  right: '25%',
                  height: 3,
                  borderRadius: '0 0 3px 3px',
                  background: 'var(--action)',
                }}
              />
            )}

            <div style={{ position: 'relative' }}>
              <Icon
                name={item.icon}
                size={20}
                style={{ color: isCurrent ? 'var(--action)' : 'var(--subtle)' }}
              />
              {item.key === 'orders' && hasActiveOrders && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -4,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--action)',
                  }}
                />
              )}
            </div>

            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
