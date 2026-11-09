import { memo, useState } from 'react';
import { formatMoneyCompact } from '@fastfood/utils';
import type { MenuItem } from './menu.types';
import {
  findMatch, matchesQuery, minDisplayPrice, normalizeQuery, secondaryLine, showFrom,
} from './menu.utils';
import { AddButton } from './AddButton';
import styles from '../MenuScreen.module.css';

/** The row/cell callbacks and shared state, passed as one object. */
export interface ItemHandlers {
  cartCounts: Map<string, number>;
  searchQ: string;
  /** Laptop rows show a 48px picture; phone rows drop it to give the name room. */
  showThumb: boolean;
  onAdd: (item: MenuItem) => void;
  onTap: (item: MenuItem) => void;
}

/** Search match highlighted inside text. */
export function Highlight({ text, q }: { text: string; q: string }) {
  const m = findMatch(text, q);
  if (!m) return <>{text}</>;
  return (
    <>
      {text.slice(0, m.start)}
      <mark className={styles.mark}>{text.slice(m.start, m.end)}</mark>
      {text.slice(m.end)}
    </>
  );
}

/** Photo, or the item's emoji on a tinted plate when there is none or it fails to load. */
export function Thumb({ item, className, emojiClassName }: { item: MenuItem; className: string; emojiClassName: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImg = !!item.image && failedSrc !== item.image;
  return (
    <span className={className}>
      {showImg
        ? <img src={item.image} alt="" loading="lazy" onError={() => setFailedSrc(item.image ?? null)} />
        : <span className={emojiClassName} aria-hidden="true">{item.emoji || '🍔'}</span>}
    </span>
  );
}

export const priceLabel = (item: MenuItem) =>
  `${showFrom(item) ? 'from ' : ''}${formatMoneyCompact(minDisplayPrice(item))}`;

interface RowProps {
  item: MenuItem;
  handlers: ItemHandlers;
}

/** One board row: a main button (opens the sheet) and the 44px add control. */
export const MenuRow = memo(function MenuRow({ item, handlers }: RowProps) {
  const { searchQ, cartCounts, showThumb, onAdd, onTap } = handlers;
  const soldOut   = !item.isAvailable;
  const searching = normalizeQuery(searchQ) !== '';
  const dim       = searching && !matchesQuery(item, searchQ);
  const secondary = secondaryLine(item);

  return (
    <li className={`${styles.row} ${dim ? styles.dim : ''} ${soldOut ? styles.soldOut : ''}`}>
      <button
        type="button"
        className={styles.rowMain}
        data-secondary={secondary ? 'yes' : 'no'}
        onClick={() => onTap(item)}
        aria-label={soldOut ? `${item.name} — sold out` : undefined}
      >
        {showThumb && <Thumb item={item} className={styles.thumb} emojiClassName={styles.thumbEmoji} />}
        <span className={styles.rowName}><Highlight text={item.name} q={searchQ} /></span>
        {secondary && <span className={styles.rowSecondary}><Highlight text={secondary} q={searchQ} /></span>}
        {/* The chip takes the price's place: visible on every layout, so "sold out"
            never depends on colour or opacity alone. */}
        <span className={styles.rowPrice}>
          {soldOut ? <span className={styles.chip}>Sold out</span> : priceLabel(item)}
        </span>
      </button>
      <AddButton item={item} count={cartCounts.get(item._id) ?? 0} onPress={onAdd} />
    </li>
  );
});
