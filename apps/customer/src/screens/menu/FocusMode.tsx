import { useRef, type CSSProperties, type TouchEvent } from 'react';
import { Icon } from '@/components/Icon';
import type { Category, MenuItem } from './menu.types';
import { countMatches, matchesQuery, normalizeQuery, secondaryLine } from './menu.utils';
import { AddButton } from './AddButton';
import { CatIcon } from './CatBlock';
import { Highlight, Thumb, priceLabel, type ItemHandlers } from './MenuRow';
import styles from '../MenuScreen.module.css';

function FocusCell({ item, handlers }: { item: MenuItem; handlers: ItemHandlers }) {
  const { searchQ, cartCounts, onAdd, onTap } = handlers;
  const soldOut   = !item.isAvailable;
  const secondary = secondaryLine(item);
  const searching = normalizeQuery(searchQ) !== '';
  const dim = searching && !matchesQuery(item, searchQ);
  return (
    <li className={`${styles.cell} ${dim ? styles.dim : ''} ${soldOut ? styles.soldOut : ''}`}>
      <button
        type="button"
        className={styles.cellMain}
        onClick={() => onTap(item)}
        aria-label={soldOut ? `${item.name} — sold out` : undefined}
      >
        <Thumb item={item} className={styles.cellArt} emojiClassName={styles.cellEmoji} />
        <span className={styles.cellName}><Highlight text={item.name} q={searchQ} /></span>
        {secondary && <span className={styles.cellSecondary}>{secondary}</span>}
      </button>
      <div className={styles.cellFoot}>
        <span className={styles.cellPrice}>
          {soldOut ? <span className={styles.chip}>Sold out</span> : priceLabel(item)}
        </span>
        <AddButton item={item} count={cartCounts.get(item._id) ?? 0} onPress={onAdd} />
      </div>
    </li>
  );
}

interface FocusProps {
  cats: Category[];
  grouped: Map<string, MenuItem[]>;
  openCatId: string;
  onOpen: (id: string) => void;
  columns: 2 | 3 | 4;
  handlers: ItemHandlers;
}

/**
 * Long menus: an accordion with one open category and a grid of item cards.
 * The page still never scrolls; only the open grid scrolls, and only when its
 * cards genuinely cannot fit.
 */
export function FocusMode({ cats, grouped, openCatId, onOpen, columns, handlers }: FocusProps) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  // A mostly-horizontal swipe of 50px+ moves to the next/previous category.
  const onTouchEnd = (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 2) {
      const idx = cats.findIndex(c => c._id === openCatId);
      const next = dx < 0 ? cats[idx + 1] : cats[idx - 1];
      if (next) onOpen(next._id);
    }
  };

  const searching = normalizeQuery(handlers.searchQ) !== '';

  return (
    <div
      className={styles.focus}
      style={{ '--focus-cols': columns } as CSSProperties}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {cats.map(cat => {
        const items  = grouped.get(cat._id) ?? [];
        const isOpen = openCatId === cat._id;
        const matches = countMatches(items, handlers.searchQ);
        const preview = items.slice(0, 3).map(i => i.name).join(' · ');
        return (
          <section key={cat._id} className={`${styles.focusCat} ${isOpen ? styles.focusOpen : ''}`}>
            <h2 className={styles.focusHeading}>
              <button
                type="button"
                id={`focus-btn-${cat._id}`}
                className={styles.focusBtn}
                aria-expanded={isOpen}
                aria-controls={`focus-panel-${cat._id}`}
                onClick={() => onOpen(cat._id)}
              >
                <span className={styles.focusIconWell}><CatIcon cat={cat} /></span>
                <span className={styles.focusLabel}>
                  <span className={styles.focusName}>{cat.name}</span>
                  {!isOpen && <span className={styles.focusPreview}>{preview}</span>}
                </span>
                {searching && matches > 0 && <span className={styles.matchBadge}>{matches}</span>}
                <span className={styles.focusToggle} aria-hidden="true">
                  <Icon name={isOpen ? 'minus' : 'plus'} size={16} />
                </span>
              </button>
            </h2>
            <div
              id={`focus-panel-${cat._id}`}
              className={styles.focusPanel}
              role="region"
              aria-labelledby={`focus-btn-${cat._id}`}
              // `inert` keeps a collapsed panel's buttons out of the tab order. Set as an
              // attribute so it works the same on React 18 and 19.
              ref={el => { if (el) { if (isOpen) el.removeAttribute('inert'); else el.setAttribute('inert', ''); } }}
            >
              <div className={styles.focusPanelInner}>
                <ul className={styles.focusGrid}>
                  {items.map(item => <FocusCell key={item._id} item={item} handlers={handlers} />)}
                </ul>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
