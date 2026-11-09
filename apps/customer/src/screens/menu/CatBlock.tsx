import type { CSSProperties } from 'react';
import { Icon } from '@/components/Icon';
import type { Category, MenuItem } from './menu.types';
import { countMatches, normalizeQuery } from './menu.utils';
import { MenuRow, type ItemHandlers } from './MenuRow';
import styles from '../MenuScreen.module.css';

export function CatIcon({ cat }: { cat: Category }) {
  return (
    <span className={styles.catIcon} aria-hidden="true">
      {cat.icon ? cat.icon : <Icon name="utensils" size={16} />}
    </span>
  );
}

interface BlockProps {
  cat: Category;
  items: MenuItem[];
  handlers: ItemHandlers;
  /** Outline the card briefly (arrived from a Home category tile). */
  flash?: boolean;
}

/** One category card on the board. Its height is proportional to its row count. */
export function CatBlock({ cat, items, handlers, flash }: BlockProps) {
  const matches = countMatches(items, handlers.searchQ);
  const searching = normalizeQuery(handlers.searchQ) !== '';
  return (
    <section
      className={`${styles.catBlock} ${flash ? styles.catFlash : ''}`}
      style={{ '--n': items.length } as CSSProperties}
      aria-labelledby={`cat-${cat._id}`}
    >
      <header className={styles.catHeader}>
        <CatIcon cat={cat} />
        <h2 id={`cat-${cat._id}`} className={styles.catTitle}>{cat.name}</h2>
        {searching && matches > 0
          ? <span className={styles.matchBadge}>{matches}</span>
          : <span className={styles.catCount}>{items.length}</span>}
      </header>
      <ul className={styles.rows}>
        {items.map(item => <MenuRow key={item._id} item={item} handlers={handlers} />)}
      </ul>
    </section>
  );
}

interface BoardProps {
  columns: { cat: Category; items: MenuItem[] }[][];
  handlers: ItemHandlers;
  flashCatId?: string;
}

/** Two order-preserving columns of category cards. */
export function Board({ columns, handlers, flashCatId }: BoardProps) {
  return (
    <div className={styles.board}>
      {columns.map((col, i) => (
        <div key={i} className={styles.boardCol}>
          {col.map(({ cat, items }) => (
            <CatBlock key={cat._id} cat={cat} items={items} handlers={handlers} flash={cat._id === flashCatId} />
          ))}
        </div>
      ))}
    </div>
  );
}
