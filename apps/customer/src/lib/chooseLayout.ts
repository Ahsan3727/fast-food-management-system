/**
 * chooseLayout — pure layout decision function (no React imports).
 *
 * Given the viewport dimensions and item-counts per category, returns the
 * best layout mode and an estimate of each item row's pixel height.
 *
 *  mode: 'board'  → 2-column board; categories balance into left/right columns
 *  mode: 'focus'  → accordion; one category expands at a time (2-col grid inside)
 *
 * Switch to focus when the estimated Board row height falls below MIN_BOARD_ROW_PX.
 *
 * The caller uses estRowPx only informatively (e.g. for a results table).
 * The actual row heights are determined by CSS flex/grid from the DOM.
 */

// Fixed chrome heights (px) consumed outside the menu area
const SEARCH_H       = 44;   // compact search bar
const CART_SLOT_H    = 64;   // CartBar slot (always reserved)
const NAV_H          = 56;   // BottomNav (fixed, needs spacer in flow)
const CAT_HEADER_H   = 28;   // category header strip in board mode
const FOCUS_BAR_H    = 36;   // closed accordion bar height in focus mode

/** Minimum acceptable row height before switching to focus mode */
const MIN_BOARD_ROW_PX = 38;

export type LayoutMode = 'board' | 'focus';

export interface LayoutInput {
  width: number;      // viewport width  (used for future landscape tweaks)
  height: number;     // viewport height
  categories: number[]; // item count per category (in render order)
}

export interface LayoutResult {
  mode: LayoutMode;
  estRowPx: number;   // estimated row height in the chosen mode
}

/** Height available to the menu area after subtracting chrome */
function menuAreaHeight(totalH: number): number {
  return Math.max(0, totalH - SEARCH_H - CART_SLOT_H - NAV_H);
}

/**
 * Greedy balance-split of categories into 2 columns.
 * Weight = item count + 0.6 (the 0.6 accounts for the category header strip).
 * Sort descending so the heaviest categories distribute first (best balance).
 */
function splitTwo(counts: number[]): [number, number] {
  const sorted = [...counts].sort((a, b) => b - a);
  let [w0, w1] = [0, 0];
  for (const n of sorted) {
    const w = n + 0.6;
    if (w0 <= w1) w0 += w;
    else           w1 += w;
  }
  return [w0, w1];
}

function boardEstRowPx(menuH: number, counts: number[]): number {
  if (counts.length === 0 || menuH <= 0) return 999;

  const [w0, w1] = splitTwo(counts);
  // For the taller column, reconstruct its item count and category count.
  // We only need the fraction each column holds of the total weight.
  const totalW = counts.reduce((s, n) => s + n + 0.6, 0);
  if (totalW === 0) return 999;

  const tallerFrac = Math.max(w0, w1) / totalW;

  // Approximate items and category-headers in the taller column
  const totalItems = counts.reduce((s, n) => s + n, 0);
  const tallerItems = Math.round(tallerFrac * totalItems);
  const tallerCats  = Math.round(tallerFrac * counts.length);

  if (tallerItems === 0) return 999;
  return (menuH - tallerCats * CAT_HEADER_H) / tallerItems;
}

function focusEstRowPx(menuH: number, counts: number[]): number {
  if (counts.length === 0 || menuH <= 0) return 999;
  const largest = Math.max(...counts);
  if (largest === 0) return 999;
  const barsH    = counts.length * FOCUS_BAR_H;
  const available = menuH - barsH;
  // Items displayed as a 2-column grid inside the expanded category
  return available / Math.ceil(largest / 2);
}

export function chooseLayout({ height, categories }: LayoutInput): LayoutResult {
  // Edge case: no categories → return a default
  if (categories.length === 0) {
    return { mode: 'board', estRowPx: 0 };
  }

  const mH      = menuAreaHeight(height);
  const boardRow = boardEstRowPx(mH, categories);

  if (boardRow >= MIN_BOARD_ROW_PX) {
    return { mode: 'board', estRowPx: Math.round(boardRow) };
  }

  const focusRow = focusEstRowPx(mH, categories);
  return { mode: 'focus', estRowPx: Math.max(Math.round(focusRow), 0) };
}
