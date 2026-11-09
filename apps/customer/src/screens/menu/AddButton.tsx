import { Icon } from '@/components/Icon';
import type { MenuItem } from './menu.types';
import { isComplex, badgeLabel } from './menu.utils';
import styles from '../MenuScreen.module.css';

interface Props {
  item: MenuItem;
  /** Total of this item in the cart (all sizes/add-on combinations). */
  count: number;
  onPress: (item: MenuItem) => void;
}

/**
 * The 44px control at the end of every row. Four looks, one job:
 *  quick    outline "+"      adds one
 *  options  tinted "+"       opens the sheet (a size or add-on to choose)
 *  inCart   filled count     (adds one more, or opens the sheet if it has options)
 *  soldOut  disabled "+"
 */
export function AddButton({ item, count, onPress }: Props) {
  const soldOut = !item.isAvailable;
  const complex = isComplex(item);
  const inCart  = count > 0 && !soldOut;

  const variant = soldOut ? 'soldOut' : inCart ? 'inCart' : complex ? 'options' : 'quick';
  const base = soldOut ? `${item.name} is sold out`
    : complex          ? `Customise ${item.name}`
    :                    `Add ${item.name} to cart`;
  const label = inCart ? `${base}, ${count} in cart` : base;

  return (
    <button
      type="button"
      className={`${styles.addBtn} ${styles[`add_${variant}`]}`}
      aria-label={label}
      disabled={soldOut}
      onClick={() => onPress(item)}
    >
      {variant === 'inCart'
        ? <span className={styles.addCount} aria-hidden="true">{badgeLabel(count)}</span>
        : <Icon name="plus" size={18} />}
    </button>
  );
}
