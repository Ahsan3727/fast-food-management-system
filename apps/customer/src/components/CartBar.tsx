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
    <div
      style={{
        padding: '0 16px 8px',
        position: 'sticky',
        bottom: 'calc(var(--nav-h, 56px) + 8px + env(safe-area-inset-bottom, 0px))',
        zIndex: 15,
        animation: 'cartRise var(--dur-base, 240ms) var(--ease, cubic-bezier(0.2, 0, 0, 1))',
      }}
    >
      <button
        type="button"
        onClick={() => navigate('/cart')}
        style={{
          width: '100%',
          minHeight: 52,
          padding: '0 20px',
          borderRadius: 'var(--radius-pill, 999px)',
          background: 'var(--action-bg)',
          color: 'var(--action-fg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: 'none',
          boxShadow: 'var(--shadow-3, 0 8px 24px rgba(194,65,12,0.35))',
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
          transition: 'transform var(--dur-press, 100ms) ease',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon name="bag" size={20} />
          <span>
            {count} {count === 1 ? 'item' : 'items'} · {formatMoneyCompact(total)}
          </span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>View Cart</span>
          <Icon name="right" size={16} />
        </span>
      </button>

      <style>{`
        @keyframes cartRise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
