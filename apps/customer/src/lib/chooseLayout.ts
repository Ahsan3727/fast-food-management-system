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
 *  - Board → Focus when estimated row height < 52px
 *  - Focus → Board only when estimated row height >= 56px
 *
 * Why 52/56: every row carries a 44px add button, so a row needs 44 + 4 above
 * and below. The old 38/42 let a 44px button overflow its own row.
 */

/**
 * The fixed pixels around the rows of the board. The CSS owns these numbers
 * (custom properties on the board area) and the screen reads them once, so
 * this file stays pure and the estimate cannot drift from what is drawn.
 */
export interface BoardChrome {
  /** Non-row height of ONE category card: its header plus its 2px of border. */
  catHeaderH: number;
  /** Vertical gap between category cards in the same column. */
  gap: number;
  /** Top + bottom padding of the board area (it is measured with padding in). */
  padY: number;
}

/** Phone defaults (32px header + 2px border, 8px gaps, 8px padding top and bottom). */
export const DEFAULT_BOARD_CHROME: BoardChrome = { catHeaderH: 34, gap: 8, padY: 16 };
/**
 * Laptop (>= 900px): 44px header + 2px border, 16px gaps. The 24px page padding
 * sits on the page body, outside the measured board box, so padY is 0 here.
 */
export const LAPTOP_BOARD_CHROME: BoardChrome = { catHeaderH: 46, gap: 16, padY: 0 };

export const DEFAULT_CAT_HEADER_H = DEFAULT_BOARD_CHROME.catHeaderH;
export const FOCUS_OPEN_BAR_H = 56;   // the open accordion bar
export const FOCUS_CLOSED_BAR_H = 60; // closed bars are taller: they carry a preview line
export const MIN_BOARD_ROW_PX = 52;           // switch to focus under 52px
export const HYSTERESIS_BOARD_ROW_PX = 56;    // return to board at 56px or higher

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
  chrome?: Partial<BoardChrome>; // measured board chrome (defaults: phone)
  focusOpenBarH?: number;   // optional measured open accordion bar height
  focusClosedBarH?: number; // optional measured closed accordion bar height
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
 * Estimated row height of the board, i.e. what the CSS will actually draw.
 *
 * Each column is a flex column: cards stack with `gap` between them, every
 * card keeps its fixed chrome (header + border) and shares the remaining height
 * in proportion to its row count, so rows are equal INSIDE a column. The two
 * columns have different item counts, so their rows differ; the customer's
 * tap targets are only as big as the SMALLER rows. That limiting column is
 * what must clear the 52px floor. (The old formula took the column with more
 * items but ignored gaps and padding.)
 *
 *   rowH(column) = (height - padY - (cats - 1) * gap - cats * catHeaderH) / items
 *   estimate     = min over non-empty columns
 */
export function boardEstRowPx(
  menuH: number,
  counts: number[],
  chrome: Partial<BoardChrome> = {},
): number {
  if (counts.length === 0 || menuH <= 0) return 999;

  const { catHeaderH, gap, padY } = { ...DEFAULT_BOARD_CHROME, ...chrome };
  const part = partitionCategories(counts);

  const columns = [
    { items: part.leftItems,  cats: part.leftCats },
    { items: part.rightItems, cats: part.rightCats },
  ].filter(c => c.items > 0);

  if (columns.length === 0) return 999;

  const rowHeights = columns.map(
    c => (menuH - padY - (c.cats - 1) * gap - c.cats * catHeaderH) / c.items,
  );
  return Math.max(0, Math.min(...rowHeights));
}

/**
 * Estimated row pixel height for focus mode: one open bar, the rest closed,
 * gaps between the cards, then the open category's grid gets what is left.
 */
export function focusEstRowPx(
  menuH: number,
  counts: number[],
  columns: number = 2,
  openBarH: number = FOCUS_OPEN_BAR_H,
  closedBarH: number = FOCUS_CLOSED_BAR_H,
  chrome: Partial<BoardChrome> = {},
): number {
  if (counts.length === 0 || menuH <= 0) return 999;
  const largest = Math.max(...counts);
  if (largest === 0) return 999;
  const { gap, padY } = { ...DEFAULT_BOARD_CHROME, ...chrome };
  const barsH = openBarH + (counts.length - 1) * closedBarH + (counts.length - 1) * gap;
  const available = menuH - padY - barsH;
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
  const chrome = input.chrome ?? {};

  const columns = chooseColumns(width);

  if (counts.length === 0) {
    return { mode: 'board', estRowPx: 0, columns };
  }

  const bRow = boardEstRowPx(height, counts, chrome);

  // Apply hysteresis:
  // If previously in focus mode, need at least 56px to switch back to board.
  // Otherwise switch to focus if under 52px.
  const threshold = prev === 'focus' ? HYSTERESIS_BOARD_ROW_PX : MIN_BOARD_ROW_PX;

  if (bRow >= threshold) {
    return { mode: 'board', estRowPx: Math.round(bRow), columns };
  }

  const fRow = focusEstRowPx(
    height, counts, columns,
    input.focusOpenBarH ?? FOCUS_OPEN_BAR_H,
    input.focusClosedBarH ?? FOCUS_CLOSED_BAR_H,
    chrome,
  );
  return { mode: 'focus', estRowPx: Math.max(Math.round(fRow), 0), columns };
}
