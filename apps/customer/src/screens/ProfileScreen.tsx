import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import BottomNav from '@/components/BottomNav';
import styles from './ProfileScreen.module.css';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/me').then(r => r.data.user),
  });

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const displayUser = profile ?? user;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatar}>{displayUser?.name?.[0]?.toUpperCase() ?? '?'}</div>
        <p className={styles.name}>{displayUser?.name}</p>
        <p className={styles.phone}>{displayUser?.phone ?? displayUser?.email}</p>
      </div>

      <div className={styles.list}>
        <div className={styles.item} onClick={() => navigate('/orders')}>
          <span>📦</span>
          <span>My Orders</span>
          <span className={styles.chevron}>›</span>
        </div>
        <div className={styles.item} onClick={() => toast('Address picker coming soon')}>
          <span>📍</span>
          <span>Saved Addresses</span>
          <span className={styles.chevron}>›</span>
        </div>
        <div className={styles.item} onClick={() => toast('Settings coming soon')}>
          <span>⚙️</span>
          <span>Settings</span>
          <span className={styles.chevron}>›</span>
        </div>
        <div className={styles.item} onClick={() => toast('Help coming soon')}>
          <span>❓</span>
          <span>Help & Support</span>
          <span className={styles.chevron}>›</span>
        </div>
      </div>

      <button className={styles.logoutBtn} onClick={handleLogout}>
        Sign Out
      </button>

      <BottomNav active="profile" />
    </div>
  );
}
