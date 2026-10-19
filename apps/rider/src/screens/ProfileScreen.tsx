import { useNavigate } from 'react-router-dom';
import { useRiderAuthStore } from '@/store/auth.store';
import styles from './ProfileScreen.module.css';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { rider, logout } = useRiderAuthStore();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } finally { logout(); navigate('/login', { replace: true }); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>←</button>
        <h1>Profile</h1>
      </div>
      <div className={styles.avatar}>{rider?.name?.[0]?.toUpperCase() ?? '?'}</div>
      <p className={styles.name}>{rider?.name}</p>
      <p className={styles.phone}>{rider?.phone}</p>
      <div className={styles.list}>
        <div className={styles.item} onClick={() => toast('Settings coming soon')}>⚙️ Settings <span>›</span></div>
        <div className={styles.item} onClick={() => toast('Help coming soon')}>❓ Help <span>›</span></div>
      </div>
      <button className={styles.logout} onClick={handleLogout}>Sign Out</button>
    </div>
  );
}
