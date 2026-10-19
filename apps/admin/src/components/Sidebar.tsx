import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/admin.store';
import api from '@/lib/api';

const NAV = [
  { path: '/',          icon: '📊', label: 'Dashboard' },
  { path: '/orders',    icon: '🧾', label: 'Orders' },
  { path: '/menu',      icon: '🍔', label: 'Menu Manager' },
  { path: '/riders',    icon: '🏍️', label: 'Riders' },
  { path: '/customers', icon: '👥', label: 'Customers' },
  { path: '/analytics', icon: '📈', label: 'Analytics' },
];

export default function Sidebar({ currentPath }: { currentPath: string }) {
  const navigate = useNavigate();
  const { logout } = useAdminStore();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } finally { logout(); navigate('/login'); }
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">🍔</span>
        <div>
          <div className="sidebar-brand-name">FastFood</div>
          <div className="sidebar-brand-sub">Admin Panel</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(item => (
          <button
            key={item.path}
            className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="nav-item" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
