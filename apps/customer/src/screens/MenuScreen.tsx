/**
 * MenuScreen: the menu on one screen, no page scrolling.
 *
 *  - Board: every category visible at once (2 columns of cards). Used while every
 *    row can be at least 52px tall (a 44px add button + 4px above and below).
 *  - Focus: for long menus, an accordion with one open category and a grid of
 *    item cards. The page still never scrolls.
 *  - Laptop (>= 900px): top nav, the board, and a cart panel beside it.
 *
 * chooseLayout decides board vs focus from the real measured height. The state
 * of the data (loading / offline / error / empty / ready) comes from
 * deriveMenuState, so a failed or offline load is never shown as "empty".
 */

import {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MAX_LINE_QTY } from '@fastfood/shared-types';
import { ItemDetailSheet } from './ItemDetailSheet';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import AppNav from '@/components/AppNav';
import CartBar from '@/components/CartBar';
import CartPanel from '@/components/CartPanel';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { FreeDeliveryStrip } from '@/components/FreeDeliveryStrip';
import { Icon } from '@/components/Icon';
import { QK } from '@/api/queryKeys';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useIsLaptop } from '@/hooks/useBreakpoint';
import { isNative } from '@/lib/platform';
import { chooseLayout, partitionCategories } from '@/lib/chooseLayout';
import type { LayoutMode } from '@/lib/chooseLayout';
import type { Category, MenuItem } from './menu/menu.types';
import {
  deriveMenuState, firstMatchingCategoryId, hasNoMatches, isComplex, matchesQuery, resolveCatParam,
} from './menu/menu.utils';
import { readBoardChrome } from './menu/boardChrome';
import { Board } from './menu/CatBlock';
import { FocusMode } from './menu/FocusMode';
import { MenuSkeleton, MenuStateView, NoMatches } from './menu/MenuStates';
import type { ItemHandlers } from './menu/MenuRow';
import styles from './MenuScreen.module.css';

// HomeScreen, SearchScreen and the item sheet import this type from here.
export type { MenuItem } from './menu/menu.types';

/** Fire a light haptic only inside Capacitor native apps */
async function lightHaptic(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* ignore: safe if not available */ }
}

export default function MenuScreen() {
  const isLaptop = useIsLaptop();
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get('cat');

  const [searchQ,       setSearchQ      ] = useState('');
  const [layoutMode,    setLayoutMode   ] = useState<LayoutMode>('board');
  const [columns,       setColumns      ] = useState<2 | 3 | 4>(2);
  const [openCatId,     setOpenCatId    ] = useState('');
  const [selectedItem,  setSelectedItem ] = useState<MenuItem | null>(null);
  const [announcement,  setAnnouncement ] = useState('');
  const [flashCatId,    setFlashCatId   ] = useState('');   // board: brief highlight after a ?cat= link

  const { addItem, items: cartItems, displayTotalPaisa } = useCartStore();
  const { data: config } = useAppConfig();

  const menuAreaRef      = useRef<HTMLElement>(null);
  const cartBarSlotRef   = useRef<HTMLDivElement>(null);
  const searchFocusedRef = useRef(false);   // freeze layout recalc while typing
  const appliedCatParam  = useRef<string | null>(null);

  // ── Cart counts map: menuItemId → total quantity ──────────────────────────
  const cartCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const ci of cartItems) {
      m.set(ci.menuItemId, (m.get(ci.menuItemId) ?? 0) + ci.quantity);
    }
    return m;
  }, [cartItems]);

  // ── Data ──────────────────────────────────────────────────────────────────
  const catsQuery = useQuery<Category[]>({
    queryKey: QK.categories,
    queryFn:  () => api.get('/menu/categories').then(r => r.data),
    staleTime: 60_000,
  });
  const { data: cats = [] } = catsQuery;

  // Fetch ALL items once (including unavailable to show sold-out rows)
  const itemsQuery = useQuery<MenuItem[]>({
    queryKey: QK.menu(undefined, true),
    queryFn:  () => api.get('/menu?includeUnavailable=true').then(r => r.data),
    staleTime: 60_000,
  });
  const { data: items = [] } = itemsQuery;

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

  // Active categories that have at least one item (inactive / empty ones never render)
  const activeCats = useMemo(
    () => cats.filter(c => c.isActive && (grouped.get(c._id)?.length ?? 0) > 0),
    [cats, grouped],
  );

  const menuState = deriveMenuState({
    cats:  catsQuery,
    items: itemsQuery,
    activeCatCount: activeCats.length,
  });
  const ready = menuState === 'ready';

  // ── Layout: board or focus, from the REAL measured height ─────────────────
  const recalcLayout = useCallback(() => {
    if (searchFocusedRef.current) return;   // don't jump mode while the keyboard is open
    const el = menuAreaRef.current;
    if (!el || !ready) return;
    const counts = activeCats.map(c => grouped.get(c._id)?.length ?? 0);
    const result = chooseLayout({
      width:  window.innerWidth,
      height: el.clientHeight,
      counts,
      prev:   layoutMode,
      chrome: readBoardChrome(el),   // header / gap / padding come from the CSS
    });
    setLayoutMode(prev => (prev === result.mode ? prev : result.mode));
    setColumns(prev => (prev === result.columns ? prev : result.columns));
  }, [activeCats, grouped, layoutMode, ready]);

  useEffect(() => {
    recalcLayout();
    const el = menuAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(recalcLayout);
    ro.observe(el);
    return () => ro.disconnect();
  }, [recalcLayout, isLaptop]);

  // ── Which category is open (focus mode) ───────────────────────────────────
  // One effect so a ?cat= deep link and the "first category" default can't fight.
  useEffect(() => {
    if (activeCats.length === 0) return;
    const fromUrl = resolveCatParam(catParam, activeCats);
    if (fromUrl && appliedCatParam.current !== catParam) {
      appliedCatParam.current = catParam;
      setOpenCatId(fromUrl);        // focus mode opens it
      setFlashCatId(fromUrl);       // board mode shows everything, so outline it for 1.5s
      return;
    }
    if (!openCatId || !activeCats.some(c => c._id === openCatId)) {
      setOpenCatId(activeCats[0]._id);
    }
  }, [activeCats, catParam, openCatId]);

  useEffect(() => {
    if (!flashCatId) return;
    const t = setTimeout(() => setFlashCatId(''), 1500);
    return () => clearTimeout(t);
  }, [flashCatId]);

  // Searching in focus mode opens the first matching category
  useEffect(() => {
    if (layoutMode !== 'focus') return;
    const first = firstMatchingCategoryId(activeCats, grouped, searchQ);
    if (first) setOpenCatId(first);
  }, [searchQ, layoutMode, activeCats, grouped]);

  // ── Search: matches, "nothing matches", and the polite announcement ───────
  const searching = searchQ.trim() !== '';
  const noMatches = ready && hasNoMatches(grouped, searchQ);
  const matchTotal = useMemo(() => {
    if (!searching) return 0;
    let n = 0;
    for (const c of activeCats) n += (grouped.get(c._id) ?? []).filter(i => matchesQuery(i, searchQ)).length;
    return n;
  }, [searching, activeCats, grouped, searchQ]);

  useEffect(() => {
    if (!ready || !searching) return;
    setAnnouncement(matchTotal === 0 ? 'No items match' : `${matchTotal} ${matchTotal === 1 ? 'item matches' : 'items match'}`);
  }, [ready, searching, matchTotal]);

  // ── Board columns (order-preserving contiguous split) ─────────────────────
  const boardColumns = useMemo(() => {
    const part = partitionCategories(activeCats.map(c => grouped.get(c._id)?.length ?? 0));
    const build = (idx: number[]) => idx.map(i => ({ cat: activeCats[i], items: grouped.get(activeCats[i]._id) ?? [] }));
    return [build(part.left), build(part.right)].filter(col => col.length > 0);
  }, [activeCats, grouped]);

  // ── Item actions ──────────────────────────────────────────────────────────
  const bumpCartBar = useCallback(() => {
    const slot = cartBarSlotRef.current;
    if (!slot) return;
    slot.classList.remove(styles.cartBarBump);
    void slot.offsetWidth; // force reflow so the animation restarts if already playing
    slot.classList.add(styles.cartBarBump);
  }, []);

  const announceCart = useCallback((what: string) => {
    const n = useCartStore.getState().totalItems();
    setAnnouncement(`${what}. ${n} ${n === 1 ? 'item' : 'items'} in cart`);
  }, []);

  const handleAdd = useCallback(async (item: MenuItem) => {
    if (isComplex(item)) {
      // Open the detail sheet so the customer can pick size / add-ons
      setSelectedItem(item);
      return;
    }
    if (!item.isAvailable) return;
    if ((cartCounts.get(item._id) ?? 0) >= MAX_LINE_QTY) {
      toast(`You can order up to ${MAX_LINE_QTY} of one item`);
      return;
    }
    await lightHaptic();
    addItem({
      menuItemId:     item._id,
      name:           item.name,
      image:          item.image,
      emoji:          item.emoji,
      addOns:         [],
      unitPricePaisa: item.basePrice,
      quantity:       1,
    });
    bumpCartBar();
    announceCart(`${item.name} added`);
  }, [addItem, bumpCartBar, announceCart, cartCounts]);

  const handleTap = useCallback((item: MenuItem) => setSelectedItem(item), []);
  const closeSheet = useCallback(() => setSelectedItem(null), []);
  const handleSheetAdded = useCallback(() => { bumpCartBar(); announceCart('Added'); }, [bumpCartBar, announceCart]);

  const handleRetry = () => {
    if (catsQuery.isError)  void catsQuery.refetch();
    if (itemsQuery.isError) void itemsQuery.refetch();
  };

  const handlers: ItemHandlers = useMemo(
    () => ({ onAdd: handleAdd, onTap: handleTap, cartCounts, searchQ, showThumb: isLaptop }),
    [handleAdd, handleTap, cartCounts, searchQ, isLaptop],
  );

  // ── Search field: in the header on phones, in the top bar on laptops ──────
  const searchField = (
    <div className={styles.search}>
      <Icon name="search" size={18} className={styles.searchIcon} />
      <input
        type="text"
        inputMode="search"
        className={styles.searchInput}
        placeholder="Search the menu"
        aria-label="Search the menu"
        value={searchQ}
        disabled={!ready}
        onChange={e => setSearchQ(e.target.value)}
        onFocus={() => { searchFocusedRef.current = true; }}
        onBlur={()  => { searchFocusedRef.current = false; recalcLayout(); }}
      />
      {searchQ && (
        <button type="button" className={styles.searchClear} aria-label="Clear search" onClick={() => setSearchQ('')}>
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );

  // ── What goes in the board area ───────────────────────────────────────────
  let content;
  if (menuState === 'loading')      content = <MenuSkeleton />;
  else if (menuState !== 'ready')   content = <MenuStateView state={menuState} onRetry={handleRetry} />;
  else if (noMatches)               content = <NoMatches onClear={() => setSearchQ('')} />;
  else if (layoutMode === 'focus')  content = (
    <FocusMode
      cats={activeCats}
      grouped={grouped}
      openCatId={openCatId}
      onOpen={setOpenCatId}
      columns={columns}
      handlers={handlers}
    />
  );
  else                              content = <Board columns={boardColumns} handlers={handlers} flashCatId={flashCatId} />;

  return (
    <div className={styles.page}>
      <ConnectionBanner offlineMessage="You're offline. Showing the last menu we loaded." />

      {isLaptop ? (
        <h1 className={styles.srOnly}>Menu</h1>
      ) : (
        <header className={styles.header}>
          <h1 className={styles.title}>Menu</h1>
          {searchField}
        </header>
      )}

      {!isLaptop && (
        <FreeDeliveryStrip
          variant="compact"
          subtotalPaisa={displayTotalPaisa()}
          thresholdPaisa={config?.freeDeliveryOverPaisa}
          feePaisa={config?.deliveryFeePaisa}
        />
      )}

      <div className={styles.body}>
        <main className={styles.menuArea} ref={menuAreaRef} aria-busy={menuState === 'loading'}>
          {content}
        </main>
        {isLaptop && <CartPanel />}
      </div>

      {!isLaptop && (
        <>
          <div
            ref={cartBarSlotRef}
            className={styles.cartBarSlot}
            onAnimationEnd={() => cartBarSlotRef.current?.classList.remove(styles.cartBarBump)}
          >
            <CartBar />
          </div>
          <div className={styles.navSpacer} />
        </>
      )}

      <AppNav active="menu" search={isLaptop ? searchField : undefined} />

      <ItemDetailSheet item={selectedItem} onClose={closeSheet} onAdded={handleSheetAdded} />

      <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    </div>
  );
}
