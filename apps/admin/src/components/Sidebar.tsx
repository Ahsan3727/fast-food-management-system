import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAdminStore } from '@/store/admin.store';
import api from '@/lib/api';
import { Icon, IconName } from '@/components/Icon';

interface NavItem {
  path: string;
  icon: IconName;
  label: string;
}

const NAV: NavItem[] = [
  { path: '/', icon: 'home', label: 'Live Board' },
  { path: '/orders', icon: 'receipt', label: 'Orders' },
  { path: '/menu', icon: 'utensils', label: 'Menu Manager' },
  { path: '/riders', icon: 'bike', label: 'Riders' },
  { path: '/customers', icon: 'users', label: 'Customers' },
  { path: '/analytics', icon: 'chart', label: 'Analytics' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAdminStore();

  const { data: placedCount = 0 } = useQuery<number>({
    queryKey: ['orders-placed-count'],
    queryFn: async () => {
      try {
        const res = await api.get('/orders?status=PLACED&limit=50');
        const list = res.data?.items ?? res.data?.orders ?? (Array.isArray(res.data) ? res.data : []);
        return list.length;
      } catch {
        return 0;
      }
    },
    staleTime: 15_000,
  });

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
    <aside className="admin-sidebar" aria-label="Main Navigation">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Icon name="flame" size={22} />
        </div>
        <div className="sidebar-brand-name-wrap">
          <div className="sidebar-brand-name">FastFood</div>
          <div className="sidebar-brand-sub">Admin Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.path === '/'}
          >
            <span className="nav-icon">
              <Icon name={item.icon} size={20} />
            </span>
            <span className="nav-item-label" style={{ flex: 1 }}>
              {item.label}
            </span>
            {item.path === '/orders' && placedCount > 0 && (
              <span
                className="nav-item-badge"
                style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--danger-solid)',
                  color: 'var(--on-danger)',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 6px',
                }}
              >
                {placedCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          className="nav-item"
          onClick={handleLogout}
          aria-label="Sign Out"
        >
          <span className="nav-icon">
            <Icon name="out" size={20} />
          </span>
          <span className="nav-item-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
