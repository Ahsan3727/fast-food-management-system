import { useNavigate, useLocation } from 'react-router-dom';

interface Props {
  active: 'home' | 'menu' | 'orders' | 'profile';
}

const items: { key: Props['active']; label: string; icon: string; path: string }[] = [
  { key: 'home', label: 'Home', icon: '🏠', path: '/' },
  { key: 'menu', label: 'Menu', icon: '🍽️', path: '/menu' },
  { key: 'orders', label: 'Orders', icon: '📦', path: '/orders' },
  { key: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
];

export default function BottomNav({ active }: Props) {
  const navigate = useNavigate();
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.key}
          className={`bottom-nav-item ${active === item.key ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
