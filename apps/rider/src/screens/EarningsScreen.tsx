import { useNavigate } from 'react-router-dom';
import styles from './EarningsScreen.module.css';

export default function EarningsScreen() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>←</button>
        <h1>Earnings</h1>
      </div>
      <div className={styles.empty}>
        <span>💰</span>
        <p>Earnings history will show here after your first delivery</p>
      </div>
    </div>
  );
}
