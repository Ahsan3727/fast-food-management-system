import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cart.store';
import { formatMoneyCompact } from '@fastfood/utils';
import { Icon } from '@/components/Icon';

export default function CartBar() {
  const navigate = useNavigate();
  const { totalItems, displayTotalPaisa } = useCartStore();
  const count = totalItems();
  const total = displayTotalPaisa();

  if (count === 0) return null;

  return (
    <div style={{ padding: '0 16px 8px', position: 'sticky', bottom: 64, zIndex: 15 }}>
      <button
        onClick={() => navigate('/cart')}
        style={{
          width: '100%',
          minHeight: 52,
          padding: '0 20px',
          borderRadius: 999,
          background: 'var(--action)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: 'none',
          boxShadow: '0 8px 24px rgba(194,65,12,0.35)',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon name="bag" size={18} />
          <span>
            {count} {count === 1 ? 'item' : 'items'} · {formatMoneyCompact(total)}
          </span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>View Cart</span>
          <Icon name="right" size={16} />
        </span>
      </button>
    </div>
  );
}
