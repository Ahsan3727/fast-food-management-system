import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import BottomNav from '@/components/BottomNav';
import { formatMoneyCompact } from '@fastfood/utils';
import styles from './HomeScreen.module.css';

function CategoryChip({ name, icon, onClick }: { name: string; icon: string; onClick: () => void }) {
  return (
    <button className={styles.chip} onClick={onClick}>
      <span className={styles.chipIcon}>{icon}</span>
      <span className={styles.chipLabel}>{name}</span>
    </button>
  );
}

function MenuItemCard({ item, onAdd }: { item: any; onAdd: () => void }) {
  const navigate = useNavigate();
  return (
    <div className={styles.itemCard} onClick={() => navigate(`/menu/${item._id}`)}>
      <div className={styles.itemImage} style={{ background: item.color ?? '#fed7aa' }}>
        {item.image
          ? <img src={item.image} alt={item.name} className={styles.itemImg} />
          : <span className={styles.itemEmoji}>{item.emoji ?? '🍔'}</span>
        }
      </div>
      <div className={styles.itemInfo}>
        <p className={styles.itemName}>{item.name}</p>
        <p className={styles.itemPrice}>
          {formatMoneyCompact(item.basePrice)}
        </p>
      </div>
      <button className={styles.addBtn} onClick={(e) => { e.stopPropagation(); onAdd(); }}>+</button>
    </div>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addItem, totalItems, displayTotalPaisa } = useCartStore();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/menu/categories').then(r => r.data),
  });

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menu'],
    queryFn: () => api.get('/menu').then(r => r.data),
  });

  const cartCount = totalItems();
  const cartTotal = displayTotalPaisa();

  const promos = [
    { label: 'Fresh today', desc: 'Up to 30% off', emoji: '🥗', bg: '#fed7aa' },
    { label: 'Hot deals', desc: 'Burgers from Rs. 350', emoji: '🍔', bg: '#fde68a' },
    { label: 'New arrivals', desc: 'Desserts & more', emoji: '🍰', bg: '#fce7f3' },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</p>
          <p className={styles.subGreeting}>What are you craving today?</p>
        </div>
        <button className={styles.cartBtn} onClick={() => navigate('/cart')}>
          🛒
          {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
        </button>
      </div>

      {/* Search bar */}
      <div className={styles.searchWrap}>
        <button className={styles.searchBar} onClick={() => navigate('/search')}>
          <span>🔍</span>
          <span className={styles.searchPlaceholder}>Search food, burgers, pizza…</span>
        </button>
      </div>

      <div className={styles.content}>
        {/* Promo carousel */}
        <div className={styles.promoRow}>
          {promos.map((p, i) => (
            <div key={i} className={styles.promoCard} style={{ background: p.bg }}>
              <div>
                <p className={styles.promoLabel}>{p.label}</p>
                <p className={styles.promoDesc}>{p.desc}</p>
              </div>
              <span className={styles.promoEmoji}>{p.emoji}</span>
            </div>
          ))}
        </div>

        {/* Categories */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Categories</h2>
          <button onClick={() => navigate('/menu')} className={styles.seeAll}>See all →</button>
        </div>
        <div className={styles.categoryRow}>
          {(categories.length > 0 ? categories : [
            { _id: '1', name: 'Burgers', icon: '🍔' },
            { _id: '2', name: 'Pizza', icon: '🍕' },
            { _id: '3', name: 'Drinks', icon: '🥤' },
            { _id: '4', name: 'Desserts', icon: '🍰' },
          ]).map((cat: any) => (
            <CategoryChip
              key={cat._id}
              name={cat.name}
              icon={cat.icon ?? '🍽️'}
              onClick={() => navigate(`/menu?category=${cat._id}`)}
            />
          ))}
        </div>

        {/* Menu Grid */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>🔥 Popular</h2>
        </div>
        {isLoading
          ? <div className={styles.grid}>
              {[1,2,3,4,5,6].map(i => <div key={i} className={`skeleton ${styles.skeletonCard}`} />)}
            </div>
          : <div className={styles.grid}>
              {(menuItems as any[]).slice(0, 12).map((item: any) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  onAdd={() => addItem({
                    menuItemId: item._id,
                    name: item.name,
                    image: item.image,
                    emoji: item.emoji,
                    addOns: [],
                    unitPricePaisa: item.basePrice,
                    quantity: 1,
                  })}
                />
              ))}
            </div>
        }
      </div>

      {/* Cart summary bar */}
      {cartCount > 0 && (
        <div className={styles.cartBar} onClick={() => navigate('/cart')}>
          <span className={styles.cartBarCount}>{cartCount} items</span>
          <span className={styles.cartBarText}>View Cart</span>
          <span className={styles.cartBarTotal}>{formatMoneyCompact(cartTotal)}</span>
        </div>
      )}

      <BottomNav active="home" />
    </div>
  );
}
