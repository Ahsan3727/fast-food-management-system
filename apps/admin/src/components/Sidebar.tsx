import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAdminStore } from '@/store/admin.store';
import api from '@/lib/api';
import { Icon, IconName } from '@/components/Icon';
import { STATUS_META, OrderStatus } from '@fastfood/shared-types';

interface NavItem {
  path: string;
  icon: IconName;
  label: string;
}

const NAV: NavItem[] = [
  { path: '/', icon: 'home', label: 'Dashboard' },
  { path: '/orders', icon: 'receipt', label: 'Orders' },
  { path: '/menu', icon: 'utensils', label: 'Menu Manager' },
  { path: '/riders', icon: 'bike', label: 'Riders' },
  { path: '/customers', icon: 'users', label: 'Customers' },
  { path: '/analytics', icon: 'chart', label: 'Analytics' },
];

export default function Sidebar({ currentPath }: { currentPath: string }) {
  const navigate = useNavigate();
  const { logout } = useAdminStore();

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
    staleTime: 15000,
  });

  const activeCount = orders.filter(o => STATUS_META[o.status as OrderStatus]?.isActive).length;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <aside className="admin-sidebar" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
      <div
        className="sidebar-brand"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '18px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--action)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(194,65,12,0.35)',
          }}
        >
          <Icon name="flame" size={20} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            FastFood
          </div>
          <div style={{ fontSize: 11, color: 'var(--subtle)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Admin Portal
          </div>
        </div>
      </div>

      <nav className="sidebar-nav" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV.map(item => {
          const isActive = currentPath === item.path;
          const showBadge = item.path === '/orders' && activeCount > 0;
          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: isActive ? 'var(--sunken)' : 'transparent',
                color: isActive ? 'var(--action)' : 'var(--muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon name={item.icon} size={18} style={{ color: isActive ? 'var(--action)' : 'var(--subtle)' }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {showBadge && (
                <span
                  style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    background: 'var(--action)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'grid',
                    placeItems: 'center',
                    padding: '0 6px',
                  }}
                >
                  {activeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom" style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <button
          className="nav-item"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: 'none',
            background: 'transparent',
            color: 'var(--muted)',
            fontWeight: 500,
            fontSize: 14,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Icon name="out" size={18} style={{ color: 'var(--subtle)' }} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
