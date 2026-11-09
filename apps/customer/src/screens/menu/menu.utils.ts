/**
 * menu.utils — pure helpers for MenuScreen. No React, no DOM, no network.
 *
 * Only type imports, so it is trivial to unit-test and MenuScreen <-> helpers
 * can never become a circular dependency.
 */
import type { Category, MenuItem } from './menu.types';

/**
 * The part of a TanStack Query v5 result that decides what the menu shows.
 * A real `UseQueryResult` is structurally assignable to this, so MenuScreen
 * passes its query objects straight in.
 */
export interface QuerySnapshot {
  /** pending = no data yet, error = last fetch failed, success = has data */
  status: 'pending' | 'error' | 'success';
  /** paused = wanted to fetch but the device is offline */
  fetchStatus: 'fetching' | 'paused' | 'idle';
  /** undefined until the query has produced data at least once */
  data: unknown;
}

export type MenuState = 'loading' | 'offline' | 'error' | 'empty' | 'ready';

export interface MenuStateInput {
  cats: QuerySnapshot;
  items: QuerySnapshot;
  /** Active categories that contain at least one item (what the screen renders) */
  activeCatCount: number;
}

/**
 * Collapse the two menu queries into the ONE state the screen should show.
 *
 * Why this exists: the screen used to read only `isLoading`. On a failed or
 * offline load `items` fell back to `[]`, so the customer saw
 * "Menu is empty right now." for what is really a connection problem.
 *
 * Rules, in priority order:
 *  1. A query that already holds data is usable, even if a later refetch
 *     failed or the device went offline (stale menu beats no menu).
 *  2. Otherwise, if any missing query is paused -> 'offline'. TanStack resumes
 *     paused queries by itself when the network returns, so there is no
 *     retry button for this state.
 *  3. Otherwise, if any missing query failed -> 'error' (shows Try again).
 *  4. Otherwise -> 'loading'.
 *  5. Both have data: 'empty' when nothing can be rendered, else 'ready'.
 *
 * 'offline' outranks 'error' because when both apply, the device being offline
 * is the more accurate message and it heals on its own on reconnect.
 */
export function deriveMenuState({ cats, items, activeCatCount }: MenuStateInput): MenuState {
  const missing = [cats, items].filter(q => q.data === undefined);

  if (missing.length > 0) {
    if (missing.some(q => q.fetchStatus === 'paused')) return 'offline';
    if (missing.some(q => q.status === 'error'))       return 'error';
    return 'loading';
  }

  return activeCatCount === 0 ? 'empty' : 'ready';
}

// ─────────────────────────────────────────────────────────────────────────────
// Item helpers (were private functions inside MenuScreen.tsx)
// ─────────────────────────────────────────────────────────────────────────────

/** True if the item needs the sheet (a choice to make) before it can be added. */
export function isComplex(item: Pick<MenuItem, 'sizes' | 'addOns'>): boolean {
  return (item.sizes?.length ?? 0) > 0 || (item.addOns?.length ?? 0) > 0;
}

/** Lowest price a customer could pay for the item. */
export function minDisplayPrice(item: Pick<MenuItem, 'basePrice' | 'sizes'>): number {
  if (!item.sizes?.length) return item.basePrice;
  return Math.min(item.basePrice, ...item.sizes.map(s => s.price));
}

/**
 * Show the "from" prefix only when the price really varies, i.e. there are
 * sizes. It used to follow isComplex(), so an item with ONLY add-ons said
 * "from Rs. 350" although it costs exactly Rs. 350.
 */
export function showFrom(item: Pick<MenuItem, 'sizes'>): boolean {
  return (item.sizes?.length ?? 0) > 0;
}

/** Count shown on the add button once the item is in the cart: 1..99, then "99+". */
export function badgeLabel(count: number): string {
  return count > 99 ? '99+' : String(Math.max(0, Math.floor(count)));
}

/** "2 sizes · 2 add-ons", or '' when the item has no choices. */
export function itemCaption(item: Pick<MenuItem, 'sizes' | 'addOns'>): string {
  const sizes = item.sizes?.length ?? 0;
  const addOns = item.addOns?.length ?? 0;
  const parts: string[] = [];
  if (sizes > 0)  parts.push(`${sizes} ${sizes === 1 ? 'size' : 'sizes'}`);
  if (addOns > 0) parts.push(`${addOns} ${addOns === 1 ? 'add-on' : 'add-ons'}`);
  return parts.join(' · ');
}

/**
 * The one line under the item name: what is inside the choice (caption) for
 * items with options, otherwise the description. '' when there is nothing to say.
 */
export function secondaryLine(item: Pick<MenuItem, 'sizes' | 'addOns' | 'description'>): string {
  return itemCaption(item) || item.description?.trim() || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Search. ONE predicate for the board rows, focus cells, dimming, the match
// badge and auto-opening a category. It was copy-pasted four times, and one
// copy skipped trim() so "zin " matched in one place and not in another.
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

export function matchesQuery(item: Pick<MenuItem, 'name' | 'description'>, q: string): boolean {
  const n = normalizeQuery(q);
  if (!n) return true;
  return item.name.toLowerCase().includes(n) || (item.description?.toLowerCase().includes(n) ?? false);
}

/** Where `q` first appears in `text` (for the highlight), or null. */
export function findMatch(text: string, q: string): { start: number; end: number } | null {
  const n = normalizeQuery(q);
  if (!n) return null;
  const start = text.toLowerCase().indexOf(n);
  return start === -1 ? null : { start, end: start + n.length };
}

export function countMatches(items: Pick<MenuItem, 'name' | 'description'>[], q: string): number {
  if (!normalizeQuery(q)) return 0;
  return items.filter(i => matchesQuery(i, q)).length;
}

/** First category (in display order) with at least one match, or undefined. */
export function firstMatchingCategoryId(
  cats: Pick<Category, '_id'>[],
  grouped: Map<string, Pick<MenuItem, 'name' | 'description'>[]>,
  q: string,
): string | undefined {
  if (!normalizeQuery(q)) return undefined;
  return cats.find(c => (grouped.get(c._id) ?? []).some(i => matchesQuery(i, q)))?._id;
}

/** True when a search is active and NOTHING anywhere matches (drives "Nothing matches that"). */
export function hasNoMatches(
  grouped: Map<string, Pick<MenuItem, 'name' | 'description'>[]>,
  q: string,
): boolean {
  if (!normalizeQuery(q)) return false;
  for (const items of grouped.values()) if (items.some(i => matchesQuery(i, q))) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deep link: /menu?cat=<id>  (HomeScreen category tiles)
// ─────────────────────────────────────────────────────────────────────────────

/** The category id from the URL if it is one we are actually showing, else null. */
export function resolveCatParam(
  param: string | null | undefined,
  activeCats: Pick<Category, '_id'>[],
): string | null {
  if (!param) return null;
  return activeCats.some(c => c._id === param) ? param : null;
}
