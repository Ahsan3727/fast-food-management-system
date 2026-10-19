import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { formatMoneyCompact } from '@fastfood/utils';
import BottomNav from '@/components/BottomNav';
import styles from './MenuScreen.module.css';

export default function MenuScreen() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const selectedCat = params.get('category') ?? '';
  const { addItem } = useCartStore();

  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/menu/categories').then(r => r.data),
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['menu', selectedCat],
    queryFn: () => api.get(`/menu${selectedCat ? `?categoryId=${selectedCat}` : ''}`).then(r => r.data),
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>←</button>
        <h1>Menu</h1>
      </div>

      {/* Category filter pills */}
      <div className={styles.filterRow}>
        <button
          className={`${styles.pill} ${!selectedCat ? styles.pillActive : ''}`}
          onClick={() => setParams({})}
        >All</button>
        {(cats as any[]).map((c: any) => (
          <button
            key={c._id}
            className={`${styles.pill} ${selectedCat === c._id ? styles.pillActive : ''}`}
            onClick={() => setParams({ category: c._id })}
          >{c.name}</button>
        ))}
      </div>

      {/* Items list */}
      <div className={styles.list}>
        {isLoading
          ? [1,2,3,4].map(i => <div key={i} className={`skeleton ${styles.skeletonRow}`} />)
          : (items as any[]).map((item: any) => (
            <div key={item._id} className={styles.row} onClick={() => navigate(`/menu/${item._id}`)}>
              <div className={styles.rowImage} style={{ background: item.color ?? '#fed7aa' }}>
                {item.image
                  ? <img src={item.image} alt={item.name} className={styles.rowImg} />
                  : <span className={styles.rowEmoji}>{item.emoji ?? '🍔'}</span>
                }
              </div>
              <div className={styles.rowInfo}>
                <p className={styles.rowName}>{item.name}</p>
                {item.description && <p className={styles.rowDesc}>{item.description}</p>}
                <p className={styles.rowPrice}>{formatMoneyCompact(item.basePrice)}</p>
              </div>
              <button
                className={styles.addBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  addItem({ menuItemId: item._id, name: item.name, image: item.image, emoji: item.emoji, addOns: [], unitPricePaisa: item.basePrice, quantity: 1 });
                }}
              >+</button>
            </div>
          ))
        }
      </div>

      <BottomNav active="menu" />
    </div>
  );
}
