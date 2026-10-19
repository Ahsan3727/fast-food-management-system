import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cart.store';
import { formatMoneyCompact } from '@fastfood/utils';
import styles from './CartScreen.module.css';

export default function CartScreen() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clear, displayTotalPaisa } = useCartStore();

  const deliveryPaisa = displayTotalPaisa() >= 100000 ? 0 : 10000; // Rs 1000 threshold, Rs 100 delivery
  const totalWithDelivery = displayTotalPaisa() + deliveryPaisa;

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <button className={styles.back} onClick={() => navigate(-1)}>←</button>
        <span className={styles.emptyEmoji}>🛒</span>
        <p className={styles.emptyText}>Your cart is empty</p>
        <button className="btn-primary" style={{ maxWidth: 200 }} onClick={() => navigate('/menu')}>
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>←</button>
        <h1>Cart ({items.length})</h1>
        <button className={styles.clearBtn} onClick={() => { if (confirm('Clear cart?')) clear(); }}>Clear</button>
      </div>

      <div className={styles.list}>
        {items.map((item) => (
          <div key={`${item.menuItemId}:${item.sizeLabel}`} className={styles.row}>
            <div className={styles.rowEmoji}>{item.emoji ?? '🍔'}</div>
            <div className={styles.rowInfo}>
              <p className={styles.rowName}>{item.name}</p>
              {item.sizeLabel && <p className={styles.rowMeta}>{item.sizeLabel}</p>}
              {item.addOns.length > 0 && <p className={styles.rowMeta}>{item.addOns.join(', ')}</p>}
              <p className={styles.rowPrice}>{formatMoneyCompact(item.unitPricePaisa * item.quantity)}</p>
            </div>
            <div className={styles.rowControls}>
              <button className={styles.qtyBtn} onClick={() => updateQuantity(item.menuItemId, item.sizeLabel, -1)}>−</button>
              <span className={styles.qty}>{item.quantity}</span>
              <button className={styles.qtyBtn} onClick={() => updateQuantity(item.menuItemId, item.sizeLabel, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>{formatMoneyCompact(displayTotalPaisa())}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Delivery</span>
          <span style={{ color: deliveryPaisa === 0 ? 'var(--success)' : undefined }}>
            {deliveryPaisa === 0 ? '🎉 Free' : formatMoneyCompact(deliveryPaisa)}
          </span>
        </div>
        {deliveryPaisa > 0 && (
          <p className={styles.freeHint}>
            Add {formatMoneyCompact(100000 - displayTotalPaisa())} more for free delivery
          </p>
        )}
        <div className={styles.summaryTotal}>
          <span>Total (est.)</span>
          <span>{formatMoneyCompact(totalWithDelivery)}</span>
        </div>
        <p className={styles.priceNote}>
          * Final price calculated at checkout by server
        </p>
      </div>

      <div className={styles.footer}>
        <button className="btn-primary" onClick={() => navigate('/checkout')}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
