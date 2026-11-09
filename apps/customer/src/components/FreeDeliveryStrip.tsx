import { Icon } from '@/components/Icon';
import { formatMoneyCompact } from '@fastfood/utils';
import { computeDelivery, deliveryStripKind } from '@/lib/delivery';
import styles from './FreeDeliveryStrip.module.css';

interface Props {
  subtotalPaisa: number;
  /** freeDeliveryOverPaisa from /app-config */
  thresholdPaisa?: number | null;
  /** deliveryFeePaisa from /app-config */
  feePaisa?: number | null;
  /** compact = one line on phones; card = inside the laptop cart panel */
  variant?: 'compact' | 'card';
}

/**
 * Progress toward free delivery. Words carry the meaning (the bar is a bonus),
 * and the whole strip disappears if the config is missing or not a number:
 * we never show NaN or a made-up threshold.
 */
export function FreeDeliveryStrip({ subtotalPaisa, thresholdPaisa, feePaisa, variant = 'compact' }: Props) {
  const info = computeDelivery(subtotalPaisa, {
    deliveryFeePaisa: feePaisa,
    freeDeliveryOverPaisa: thresholdPaisa,
  });
  if (!info.configured) return null;

  const kind = deliveryStripKind(subtotalPaisa, info);
  const text =
    kind === 'unlocked' ? 'You have free delivery'
    : kind === 'empty'  ? `Free delivery from ${formatMoneyCompact(info.thresholdPaisa)}`
    :                     `Add ${formatMoneyCompact(info.remainingPaisa)} more for free delivery`;
  const pct = Math.round(info.progress * 100);

  return (
    <div className={`${styles.strip} ${variant === 'card' ? styles.card : styles.compact} ${info.isFree ? styles.unlocked : ''}`}>
      <span className={styles.well} aria-hidden="true">
        <Icon name={info.isFree ? 'check' : 'truck'} size={variant === 'card' ? 18 : 15} />
      </span>
      <span className={styles.text}>{text}</span>
      <span
        className={styles.track}
        role="img"
        aria-label={`${pct}% of the way to free delivery`}
      >
        <span className={styles.fill} style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
