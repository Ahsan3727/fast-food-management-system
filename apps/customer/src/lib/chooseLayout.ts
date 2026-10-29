/**
 * chooseLayout — pure layout decision function (no React imports).
 *
 * Given the viewport dimensions and item-counts per category, returns the
 * best layout mode, estimated row height, and column count.
 *
 *  mode: 'board'  → multi-column board; categories balance into columns keeping sortOrder
 *  mode: 'focus'  → accordion; one category expands at a time (multi-col grid inside)
 *
 * Hysteresis:
 *  - Board → Focus when estimated row height < 38px
 *  - Focus → Board only when estimated row height >= 42px
 */

export const DEFAULT_CAT_HEADER_H = 28; // category header strip in board mode
export const DEFAULT_FOCUS_BAR_H = 36;  // closed accordion bar height in focus mode
export const MIN_BOARD_ROW_PX = 38;     // switch to focus under 38px
export const HYSTERESIS_BOARD_ROW_PX = 42; // return to board at 42px or higher

export type LayoutMode = 'board' | 'focus';

export interface PartitionResult {
  left: number[];       // indices of categories in left column
  right: number[];      // indices of categories in right column
  leftItems: number;    // total item count in left column
  leftCats: number;     // category count in left column
  rightItems: number;   // total item count in right column
  rightCats: number;    // category count in right column
}

export interface LayoutInput {
  width: number;        // viewport width
  height: number;       // available menu height (or total viewport height)
  categories?: number[]; // item count per category (in render order)
  counts?: number[];    // alias for categories
  prev?: LayoutMode;    // previous layout mode for hysteresis
  catHeaderH?: number;  // optional measured header height
  focusBarH?: number;   // optional measured accordion bar height
}

export interface LayoutResult {
  mode: LayoutMode;
  estRowPx: number;
  columns: 2 | 3 | 4;
}

/**
 * Contiguous order-preserving partition of categories into 2 columns.
 * Weight per category = item count + 0.6 (0.6 accounts for the header strip).
 * Tests all contiguous split points and selects the one with the smallest
 * maximum column weight, ensuring the owner's sortOrder is strictly preserved.
 */
export function partitionCategories(counts: number[]): PartitionResult {
  const n = counts.length;
  if (n === 0) {
    return { left: [], right: [], leftItems: 0, leftCats: 0, rightItems: 0, rightCats: 0 };
  }
  if (n === 1) {
    return {
      left: [0],
      right: [],
      leftItems: counts[0],
      leftCats: 1,
      rightItems: 0,
      rightCats: 0,
    };
  }

  const weights = counts.map(c => c + 0.6);
  let bestK = 1;
  let minMaxWeight = Infinity;

  // Try split points k from 1 to n - 1
  for (let k = 1; k < n; k++) {
    let wLeft = 0;
    for (let i = 0; i < k; i++) wLeft += weights[i];

    let wRight = 0;
    for (let i = k; i < n; i++) wRight += weights[i];

    const maxW = Math.max(wLeft, wRight);
    if (maxW < minMaxWeight) {
      minMaxWeight = maxW;
      bestK = k;
    }
  }

  const left: number[] = [];
  let leftItems = 0;
  for (let i = 0; i < bestK; i++) {
    left.push(i);
    leftItems += counts[i];
  }

  const right: number[] = [];
  let rightItems = 0;
  for (let i = bestK; i < n; i++) {
    right.push(i);
    rightItems += counts[i];
  }

  return {
    left,
    right,
    leftItems,
    leftCats: left.length,
    rightItems,
    rightCats: right.length,
  };
}

/**
 * Calculates estimated row pixel height for board mode using the exact partition.
 */
export function boardEstRowPx(
  menuH: number,
  counts: number[],
  catHeaderH: number = DEFAULT_CAT_HEADER_H,
): number {
  if (counts.length === 0 || menuH <= 0) return 999;

  const part = partitionCategories(counts);
  const tallerItems = Math.max(part.leftItems, part.rightItems);
  const tallerCats = part.leftItems >= part.rightItems ? part.leftCats : part.rightCats;

  if (tallerItems === 0) return 999;
  return Math.max(0, (menuH - tallerCats * catHeaderH) / tallerItems);
}

/**
 * Calculates estimated row pixel height for focus mode.
 */
export function focusEstRowPx(
  menuH: number,
  counts: number[],
  columns: number = 2,
  focusBarH: number = DEFAULT_FOCUS_BAR_H,
): number {
  if (counts.length === 0 || menuH <= 0) return 999;
  const largest = Math.max(...counts);
  if (largest === 0) return 999;
  const barsH = counts.length * focusBarH;
  const available = menuH - barsH;
  if (available <= 0) return 0;
  return available / Math.ceil(largest / columns);
}

/**
 * Determines responsive columns based on viewport width:
 *  - >= 900px: 4 columns
 *  - >= 600px: 3 columns
 *  - < 600px:  2 columns
 */
export function chooseColumns(width: number): 2 | 3 | 4 {
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
}

export function chooseLayout(input: LayoutInput): LayoutResult {
  const counts = input.counts ?? input.categories ?? [];
  const width = input.width;
  const height = input.height;
  const prev = input.prev;
  const catHeaderH = input.catHeaderH ?? DEFAULT_CAT_HEADER_H;
  const focusBarH = input.focusBarH ?? DEFAULT_FOCUS_BAR_H;

  const columns = chooseColumns(width);

  if (counts.length === 0) {
    return { mode: 'board', estRowPx: 0, columns };
  }

  const bRow = boardEstRowPx(height, counts, catHeaderH);

  // Apply hysteresis:
  // If previously in focus mode, need at least 42px to switch back to board.
  // Otherwise switch to focus if under 38px.
  const threshold = prev === 'focus' ? HYSTERESIS_BOARD_ROW_PX : MIN_BOARD_ROW_PX;

  if (bRow >= threshold) {
    return { mode: 'board', estRowPx: Math.round(bRow), columns };
  }

  const fRow = focusEstRowPx(height, counts, columns, focusBarH);
  return { mode: 'focus', estRowPx: Math.max(Math.round(fRow), 0), columns };
}
