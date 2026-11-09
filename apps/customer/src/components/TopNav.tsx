import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { NAV_ITEMS, useHasActiveOrders, type NavProps } from '@/components/BottomNav';
import styles from './TopNav.module.css';

interface Props extends NavProps {
  /** Right-hand slot (the menu puts its search field here). */
  children?: ReactNode;
}

/** Laptop navigation (>= 900px). Same four destinations and aria-current rule as BottomNav. */
export default function TopNav({ active, children }: Props) {
  const navigate = useNavigate();
  const hasActiveOrders = useHasActiveOrders();

  return (
    <header className={styles.topNav}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true"><Icon name="flame" size={20} /></span>
        <span className={styles.brandName}>FastFood</span>
      </div>

      <nav aria-label="Main navigation" className={styles.links}>
        {NAV_ITEMS.map((item) => {
          const isCurrent = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={styles.link}
              onClick={() => navigate(item.path)}
              aria-current={isCurrent ? 'page' : undefined}
            >
              {item.label}
              {item.key === 'orders' && hasActiveOrders && <span className={styles.dot} aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      {children && <div className={styles.slot}>{children}</div>}
    </header>
  );
}
