import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { FreeDeliveryStrip } from '@/components/FreeDeliveryStrip';
import { useCartStore, lineKey, type CartItem } from '@/store/cart.store';
import { useAppConfig } from '@/hooks/useAppConfig';
import { computeDelivery } from '@/lib/delivery';
import { formatMoneyCompact } from '@fastfood/utils';
import { MAX_LINE_QTY } from '@fastfood/shared-types';
import styles from './CartPanel.module.css';

function detail(i: CartItem): string {
  const parts = [i.sizeLabel, ...(i.addOns ?? [])].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : `${formatMoneyCompact(i.unitPricePaisa)} each`;
}

/** Laptop only (>= 900px): the cart beside the menu. Phones keep the CartBar. */
export default function CartPanel() {
  const navigate = useNavigate();
  const { items, updateQuantity, totalItems, displayTotalPaisa } = useCartStore();
  const { data: config } = useAppConfig();

  const count    = totalItems();
  const subtotal = displayTotalPaisa();
  // The server decides the real fee; this is the same display rule the cart screen uses.
  const delivery = computeDelivery(subtotal, config);
  const total    = subtotal + delivery.feePaisa;

  return (
    <aside className={styles.panel} aria-label="Your cart">
      <div className={styles.head}>
        <h2 className={styles.title}>Your cart</h2>
        <span className={styles.count}>{count} {count === 1 ? 'item' : 'items'}</span>
      </div>

      <div className={styles.stripWrap}>
        <FreeDeliveryStrip
          variant="card"
          subtotalPaisa={subtotal}
          thresholdPaisa={config?.freeDeliveryOverPaisa}
          feePaisa={config?.deliveryFeePaisa}
        />
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <Icon name="bag" size={28} />
          <p>Your cart is empty</p>
          <p className={styles.emptyHint}>Tap + on any item to add it.</p>
        </div>
      ) : (
        <ul className={styles.lines}>
          {items.map(i => {
            const key = lineKey(i);
            return (
              <li key={key} className={styles.line}>
                <div className={styles.lineTop}>
                  <span className={styles.lineName}>{i.name}</span>
                  <span className={styles.lineTotal}>{formatMoneyCompact(i.unitPricePaisa * i.quantity)}</span>
                </div>
                <div className={styles.lineBottom}>
                  <span className={styles.lineDetail}>{detail(i)}</span>
                  <div className={styles.stepper} role="group" aria-label={`Quantity of ${i.name}`}>
                    <button type="button" className={styles.stepBtn} aria-label={`Remove one ${i.name}`}
                      onClick={() => updateQuantity(key, -1)}>
                      <Icon name="minus" size={16} />
                    </button>
                    <span className={styles.stepCount}>{i.quantity}</span>
                    <button type="button" className={styles.stepBtn} aria-label={`Add one ${i.name}`}
                      disabled={i.quantity >= MAX_LINE_QTY}
                      onClick={() => updateQuantity(key, +1)}>
                      <Icon name="plus" size={16} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.summary}>
        <div className={styles.sumRow}><span>Subtotal</span><span>{formatMoneyCompact(subtotal)}</span></div>
        <div className={styles.sumRow}>
          <span>Delivery fee</span>
          <span>{items.length === 0 ? '—' : delivery.feePaisa === 0 ? 'Free' : formatMoneyCompact(delivery.feePaisa)}</span>
        </div>
        <div className={`${styles.sumRow} ${styles.sumTotal}`}>
          <span>Total</span>
          <span>{formatMoneyCompact(items.length === 0 ? 0 : total)}</span>
        </div>
        <button
          type="button"
          className={styles.checkout}
          disabled={items.length === 0}
          onClick={() => navigate('/checkout')}
        >
          {items.length === 0 ? 'Checkout' : `Checkout · ${formatMoneyCompact(total)}`}
        </button>
      </div>
    </aside>
  );
}
