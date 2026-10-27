/**
 * MenuScreen — whole-menu-in-one-screen layout
 *
 * Bugs fixed vs the previous version:
 *  1. item.image (not item.imageUrl) — matches menu.schema.ts field name
 *  2. quick-add on items with sizes/addOns navigates to /menu/:id instead of
 *     silently adding at basePrice with no size selected
 *
 * Note: ProductDetailScreen.tsx also reads item.imageUrl (lines 99, 168).
 *       That bug is fixed in ProductDetailScreen.tsx (see separate edit).
 *
 * Why no inline bottom sheet for sized items:
 *   Replicating the full size-selection + add-on UI from ProductDetailScreen
 *   faithfully would require copying ~220 lines of JSX and pricing logic.
 *   That exceeds the ~80-line threshold, so we navigate to /menu/:id instead.
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { formatMoneyCompact } from '@fastfood/utils';
import BottomNav from '@/components/BottomNav';
import CartBar from '@/components/CartBar';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { QK } from '@/api/queryKeys';
import { isNative } from '@/lib/platform';
import { chooseLayout } from '@/lib/chooseLayout';
import type { LayoutMode } from '@/lib/chooseLayout';
import styles from './MenuScreen.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// Local types (mirror the API response — not imported from shared-types because
// the menu schema lives in the API package only)
// ─────────────────────────────────────────────────────────────────────────────
interface Category {
  _id: string;
  name: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
}

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  categoryId: string;
  basePrice: number;
  image?: string;   // ← API field name (not imageUrl)
  emoji?: string;
  isAvailable: boolean;
  sizes: { label: string; price: number }[];
  addOns: { label: string; price: number }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Fire a light haptic only inside Capacitor native apps */
async function lightHaptic(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* ignore — safe if not available */ }
}

/** Returns the lowest displayable price for an item */
function minDisplayPrice(item: MenuItem): number {
  if (!item.sizes?.length) return item.basePrice;
  return Math.min(item.basePrice, ...item.sizes.map(s => s.price));
}

/** True if the item requires the detail screen before adding to cart */
function isComplex(item: MenuItem): boolean {
  return (item.sizes?.length ?? 0) > 0 || (item.addOns?.length ?? 0) > 0;
}

/** Wrap the matching substring of `text` in <mark> for search highlighting */
function highlight(text: string, q: string): ReactNode {
  if (!q) return text;
  const lo  = text.toLowerCase();
  const idx = lo.indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.searchHighlight}>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

/**
 * Balance-split categories into 2 columns by weight.
 * Returns the _id arrays for each column.
 */
function splitTwoCols(
  cats: Category[],
  itemCounts: Map<string, number>,
): [string[], string[]] {
  const weighted = cats
    .map(c => ({ id: c._id, w: (itemCounts.get(c._id) ?? 0) + 0.6 }))
    .sort((a, b) => b.w - a.w); // heaviest first for best balance

  const cols: [string[], string[]] = [[], []];
  const wt:  [number,   number  ] = [0,  0 ];
  for (const { id, w } of weighted) {
    if (wt[0] <= wt[1]) { cols[0].push(id); wt[0] += w; }
    else                  { cols[1].push(id); wt[1] += w; }
  }
  return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface ItemHandlers {
  onAdd: (item: MenuItem) => void;
  onTap: (item: MenuItem) => void;
  cartCounts: Map<string, number>;
  searchQ: string;
}

// ── Add button (shared between board and focus rows) ──────────────────────────
function AddBtn({
  item,
  cartCount,
  onAdd,
}: {
  item: MenuItem;
  cartCount: number;
  onAdd: (item: MenuItem) => void;
}) {
  const complex = isComplex(item);
  return (
    <div className={styles.addBtnWrap}>
      <button
        type="button"
        className={`${styles.addBtn} ${cartCount > 0 ? styles.addBtnHasItems : ''}`}
        disabled={!item.isAvailable}
        aria-label={complex ? `Customise ${item.name}` : `Add ${item.name} to cart`}
        onClick={e => {
          e.stopPropagation();
          onAdd(item);
        }}
      >
        {cartCount > 0 ? (
          <span className={styles.addBtnCount}>{cartCount}</span>
        ) : (
          <Icon name="plus" size={13} />
        )}
      </button>
    </div>
  );
}

// ── Board-mode: one category block ───────────────────────────────────────────
function BoardCatBlock({
  cat,
  items,
  flexValue,
  handlers,
}: {
  cat: Category;
  items: MenuItem[];
  flexValue: number;
  handlers: ItemHandlers;
}) {
  const { searchQ, cartCounts, onAdd, onTap } = handlers;
  const q = searchQ.toLowerCase().trim();

  return (
    <div className={styles.boardCatBlock} style={{ flex: flexValue }}>
      <div className={styles.boardCatHeader} aria-label={`Category: ${cat.name}`}>
        <span aria-hidden="true">{cat.icon || '🍽️'}</span>
        <span className={styles.boardCatName}>{cat.name}</span>
        <span className={styles.boardCatCount}>{items.length}</span>
      </div>

      <div className={styles.boardCatItems}>
        {items.map(item => {
          const match = !q
            || item.name.toLowerCase().includes(q)
            || (item.description?.toLowerCase().includes(q) ?? false);

          return (
            <button
              key={item._id}
              type="button"
              className={`${styles.boardItemRow} ${!match && q ? styles.dimmed : ''} ${!item.isAvailable ? styles.unavailable : ''}`}
              onClick={() => onTap(item)}
              aria-label={item.isAvailable ? item.name : `${item.name} — sold out`}
            >
              <div className={styles.thumb}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className={styles.thumbImg}
                    loading="lazy"
                  />
                ) : (
                  <span className={styles.thumbEmoji} aria-hidden="true">
                    {item.emoji || '🍔'}
                  </span>
                )}
              </div>

              <div className={styles.boardItemInfo}>
                <span className={styles.boardItemName}>{highlight(item.name, q)}</span>
                {!item.isAvailable && (
                  <span className={styles.soldOutLabel}>Sold out</span>
                )}
                <span className={styles.boardItemPrice}>
                  {isComplex(item) ? 'from ' : ''}
                  {formatMoneyCompact(minDisplayPrice(item))}
                </span>
              </div>

              <AddBtn
                item={item}
                cartCount={cartCounts.get(item._id) ?? 0}
                onAdd={onAdd}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Board-mode: one column (flex-stacked category blocks) ─────────────────────
function BoardColumn({
  catIds,
  allCats,
  grouped,
  handlers,
  borderRight,
}: {
  catIds: string[];
  allCats: Category[];
  grouped: Map<string, MenuItem[]>;
  handlers: ItemHandlers;
  borderRight: boolean;
}) {
  // Column total weight for proportional flex distribution
  const totalW = catIds.reduce((s, id) => {
    return s + (grouped.get(id)?.length ?? 0) + 0.6;
  }, 0);

  return (
    <div
      className={styles.boardColumn}
      style={borderRight ? { borderRight: '1px solid var(--border)' } : undefined}
    >
      {catIds.map(id => {
        const cat = allCats.find(c => c._id === id);
        if (!cat) return null;
        const items = grouped.get(id) ?? [];
        const flexValue = totalW > 0 ? (items.length + 0.6) / totalW : 1;
        return (
          <BoardCatBlock
            key={id}
            cat={cat}
            items={items}
            flexValue={flexValue}
            handlers={handlers}
          />
        );
      })}
    </div>
  );
}

// ── Focus-mode: accordion ─────────────────────────────────────────────────────
function FocusMode({
  cats,
  grouped,
  openCatId,
  onOpen,
  handlers,
}: {
  cats: Category[];
  grouped: Map<string, MenuItem[]>;
  openCatId: string;
  onOpen: (id: string) => void;
  handlers: ItemHandlers;
}) {
  const { searchQ, cartCounts, onAdd, onTap } = handlers;
  const q = searchQ.toLowerCase().trim();

  // ── Swipe left/right to navigate between categories ──────────────────────
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 50) return; // minimum swipe distance (px)
    const idx = cats.findIndex(c => c._id === openCatId);
    if (dx < 0 && idx < cats.length - 1) onOpen(cats[idx + 1]._id); // left → next
    if (dx > 0 && idx > 0)               onOpen(cats[idx - 1]._id); // right → prev
  };

  return (
    <div
      className={styles.focusContainer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {cats.map(cat => {
        const items   = grouped.get(cat._id) ?? [];
        const isOpen  = openCatId === cat._id;
        const matches = q
          ? items.filter(i =>
              i.name.toLowerCase().includes(q) ||
              (i.description?.toLowerCase().includes(q) ?? false)
            ).length
          : 0;

        return (
          <div
            key={cat._id}
            className={`${styles.focusCat} ${isOpen ? styles.focusCatOpen : ''}`}
          >
            {/* Accordion bar */}
            <button
              type="button"
              className={styles.focusBar}
              aria-expanded={isOpen}
              onClick={() => onOpen(cat._id)}
            >
              <span aria-hidden="true">{cat.icon || '🍽️'}</span>
              <span className={styles.focusBarName}>{cat.name}</span>
              {q && matches > 0 && (
                <span className={styles.focusMatchBadge} aria-label={`${matches} matches`}>
                  {matches}
                </span>
              )}
              <Icon
                name={isOpen ? 'minus' : 'plus'}
                size={14}
                className={styles.focusBarArrow}
              />
            </button>

            {/* Expanded items — 2-col grid, inner-scroll only as last resort */}
            <div className={styles.focusItems}>
              {items.map(item => {
                const match = !q
                  || item.name.toLowerCase().includes(q)
                  || (item.description?.toLowerCase().includes(q) ?? false);

                return (
                  <button
                    key={item._id}
                    type="button"
                    className={`${styles.focusItemCell} ${!match && q ? styles.dimmed : ''} ${!item.isAvailable ? styles.unavailable : ''}`}
                    onClick={() => onTap(item)}
                    aria-label={item.isAvailable ? item.name : `${item.name} — sold out`}
                  >
                    <div className={styles.thumb}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className={styles.thumbImg}
                          loading="lazy"
                        />
                      ) : (
                        <span className={styles.thumbEmoji} aria-hidden="true">
                          {item.emoji || '🍔'}
                        </span>
                      )}
                    </div>

                    <div className={styles.focusItemInfo}>
                      <span className={styles.focusItemName}>{highlight(item.name, q)}</span>
                      {!item.isAvailable && (
                        <span className={styles.soldOutLabel}>Sold out</span>
                      )}
                      <span className={styles.focusItemPrice}>
                        {isComplex(item) ? 'from ' : ''}
                        {formatMoneyCompact(minDisplayPrice(item))}
                      </span>
                    </div>

                    <AddBtn
                      item={item}
                      cartCount={cartCounts.get(item._id) ?? 0}
                      onAdd={onAdd}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MenuScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function MenuScreen() {
  const navigate = useNavigate();
  const [searchQ,    setSearchQ   ] = useState('');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('board');
  const [openCatId,  setOpenCatId ] = useState('');

  const { addItem, items: cartItems } = useCartStore();

  const menuAreaRef      = useRef<HTMLDivElement>(null);
  const cartBarSlotRef   = useRef<HTMLDivElement>(null);
  const searchFocusedRef = useRef(false); // freeze layout recalc while typing

  // ── Cart counts map: menuItemId → total quantity ──────────────────────────
  const cartCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const ci of cartItems) {
      m.set(ci.menuItemId, (m.get(ci.menuItemId) ?? 0) + ci.quantity);
    }
    return m;
  }, [cartItems]);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: cats = [] } = useQuery<Category[]>({
    queryKey: QK.categories,
    queryFn:  () => api.get('/menu/categories').then(r => r.data),
    staleTime: 60_000,
  });

  // Fetch ALL items once; filter/group on the client.
  // Avoids re-fetching when the user switches category tabs.
  const { data: items = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: QK.menu(),
    queryFn:  () => api.get('/menu').then(r => r.data),
    staleTime: 60_000,
  });

  // ── Group items by categoryId ─────────────────────────────────────────────
  const grouped = useMemo(() => {
    const m = new Map<string, MenuItem[]>();
    for (const item of items) {
      const arr = m.get(item.categoryId) ?? [];
      arr.push(item);
      m.set(item.categoryId, arr);
    }
    return m;
  }, [items]);

  // Active categories that have at least one item in the fetched set
  const activeCats = useMemo(
    () => cats.filter(c => c.isActive && (grouped.get(c._id)?.length ?? 0) > 0),
    [cats, grouped],
  );

  // ── Layout recalculation ──────────────────────────────────────────────────
  const recalcLayout = useCallback(() => {
    if (searchFocusedRef.current) return; // don't jump mode while search is open
    const counts = activeCats.map(c => grouped.get(c._id)?.length ?? 0);
    const result = chooseLayout({
      width:      window.innerWidth,
      height:     window.innerHeight,
      categories: counts,
    });
    setLayoutMode(prev => (prev === result.mode ? prev : result.mode));
  }, [activeCats, grouped]);

  useEffect(() => {
    recalcLayout();
    const el = menuAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(recalcLayout);
    ro.observe(el);
    return () => ro.disconnect();
  }, [recalcLayout]);

  // ── Auto-open first category (focus mode init / data arrival) ────────────
  useEffect(() => {
    if (activeCats.length > 0 && !openCatId) {
      setOpenCatId(activeCats[0]._id);
    }
  }, [activeCats, openCatId]);

  // ── Auto-open first matching category when searching in focus mode ────────
  useEffect(() => {
    if (!searchQ.trim() || layoutMode !== 'focus') return;
    const q = searchQ.toLowerCase();
    const first = activeCats.find(c =>
      (grouped.get(c._id) ?? []).some(
        i => i.name.toLowerCase().includes(q) ||
             (i.description?.toLowerCase().includes(q) ?? false),
      ),
    );
    if (first) setOpenCatId(first._id);
  }, [searchQ, layoutMode, activeCats, grouped]);

  // ── Board column split ────────────────────────────────────────────────────
  const [col0Ids, col1Ids] = useMemo(
    () => splitTwoCols(
      activeCats,
      new Map(activeCats.map(c => [c._id, grouped.get(c._id)?.length ?? 0])),
    ),
    [activeCats, grouped],
  );

  // ── Item action handlers ──────────────────────────────────────────────────
  const handleAdd = useCallback(async (item: MenuItem) => {
    // BUG 2 FIX: items with sizes or add-ons require the detail screen so the
    // customer can pick a size before we add to cart.
    if (isComplex(item)) {
      navigate(`/menu/${item._id}`);
      return;
    }
    if (!item.isAvailable) return;
    await lightHaptic();
    addItem({
      menuItemId:     item._id,
      name:           item.name,
      image:          item.image,  // BUG 1 FIX: was item.imageUrl
      emoji:          item.emoji,
      addOns:         [],
      unitPricePaisa: item.basePrice,
      quantity:       1,
    });
    // Pulse the CartBar slot so the user sees visual confirmation of the add
    const slot = cartBarSlotRef.current;
    if (slot) {
      slot.classList.remove(styles.cartBarBump);
      void slot.offsetWidth; // force reflow so animation restarts if already playing
      slot.classList.add(styles.cartBarBump);
    }
  }, [navigate, addItem]);

  const handleTap = useCallback((item: MenuItem) => {
    navigate(`/menu/${item._id}`);
  }, [navigate]);

  const handlers: ItemHandlers = useMemo(
    () => ({ onAdd: handleAdd, onTap: handleTap, cartCounts, searchQ }),
    [handleAdd, handleTap, cartCounts, searchQ],
  );

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.page}>
        <ConnectionBanner />
        <div className={styles.searchBarWrap}>
          <Skeleton h={36} r="var(--r-pill)" />
        </div>
        <div className={styles.menuArea} ref={menuAreaRef}>
          <div className={styles.boardGrid}>
            {[0, 1].map(col => (
              <div
                key={col}
                className={styles.boardColumn}
                style={col === 0 ? { borderRight: '1px solid var(--border)' } : undefined}
              >
                {[3, 4, 2].map((n, ci) => (
                  <div key={ci} style={{ flex: n + 0.6, display: 'flex', flexDirection: 'column' }}>
                    <Skeleton h={28} r="0" />
                    {Array.from({ length: n }, (_, ri) => (
                      <Skeleton
                        key={ri}
                        h={0}   /* height:0 + flex:1 fills remaining space */
                        style={{ flex: 1, minHeight: 0, marginTop: 1 }}
                        r="0"
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.cartBarSlot} />
        <div className={styles.navSpacer} />
        <BottomNav active="menu" />
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!isLoading && activeCats.length === 0) {
    return (
      <div className={styles.page}>
        <ConnectionBanner />
        <div className={styles.emptyState}>
          <span style={{ fontSize: 40 }}>🍽️</span>
          <p>Menu is empty right now.</p>
        </div>
        <div className={styles.navSpacer} />
        <BottomNav active="menu" />
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <ConnectionBanner />

      {/* Compact search bar */}
      <div className={styles.searchBarWrap}>
        <Icon name="search" size={15} className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search menu…"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          onFocus={() => { searchFocusedRef.current = true; }}
          onBlur={()  => { searchFocusedRef.current = false; recalcLayout(); }}
          aria-label="Search menu items"
        />
        {searchQ && (
          <button
            type="button"
            className={styles.searchClearBtn}
            onClick={() => setSearchQ('')}
            aria-label="Clear search"
          >
            <Icon name="minus" size={13} />
          </button>
        )}
      </div>

      {/* Menu area — flex: 1, no outer scroll */}
      <div className={styles.menuArea} ref={menuAreaRef}>
        {layoutMode === 'board' ? (
          <div className={styles.boardGrid}>
            <BoardColumn
              catIds={col0Ids}
              allCats={activeCats}
              grouped={grouped}
              handlers={handlers}
              borderRight
            />
            <BoardColumn
              catIds={col1Ids}
              allCats={activeCats}
              grouped={grouped}
              handlers={handlers}
              borderRight={false}
            />
          </div>
        ) : (
          <FocusMode
            cats={activeCats}
            grouped={grouped}
            openCatId={openCatId}
            onOpen={setOpenCatId}
            handlers={handlers}
          />
        )}
      </div>

      {/* CartBar slot — always occupies its height so adding an item
          never shifts the menu rows (no CartBar changes needed) */}
      <div
        ref={cartBarSlotRef}
        className={styles.cartBarSlot}
        onAnimationEnd={() => cartBarSlotRef.current?.classList.remove(styles.cartBarBump)}
      >
        <CartBar />
      </div>

      {/* Spacer for the fixed-position BottomNav */}
      <div className={styles.navSpacer} />
      <BottomNav active="menu" />
    </div>
  );
}
