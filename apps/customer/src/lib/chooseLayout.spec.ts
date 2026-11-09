import { describe, it, expect } from 'vitest';
import {
  partitionCategories,
  boardEstRowPx,
  focusEstRowPx,
  chooseColumns,
  chooseLayout,
  DEFAULT_BOARD_CHROME,
  LAPTOP_BOARD_CHROME,
  MIN_BOARD_ROW_PX,
  HYSTERESIS_BOARD_ROW_PX,
  FOCUS_OPEN_BAR_H,
  FOCUS_CLOSED_BAR_H,
  type BoardChrome,
} from './chooseLayout';

describe('partitionCategories', () => {
  it('handles empty category array', () => {
    const res = partitionCategories([]);
    expect(res.left).toEqual([]);
    expect(res.right).toEqual([]);
    expect(res.leftItems).toBe(0);
    expect(res.rightItems).toBe(0);
  });

  it('places a single category into the left column', () => {
    const res = partitionCategories([5]);
    expect(res.left).toEqual([0]);
    expect(res.right).toEqual([]);
    expect(res.leftItems).toBe(5);
    expect(res.leftCats).toBe(1);
    expect(res.rightItems).toBe(0);
    expect(res.rightCats).toBe(0);
  });

  it('partitions categories into contiguous slices preserving sortOrder', () => {
    // Categories: [4, 5, 2, 3]
    // Valid splits:
    // k=1: [4] vs [5, 2, 3] -> weight 4.6 vs (5+2+3 + 1.8 = 11.8) -> max 11.8
    // k=2: [4, 5] vs [2, 3] -> weight (4+5 + 1.2 = 10.2) vs (2+3 + 1.2 = 6.2) -> max 10.2
    // k=3: [4, 5, 2] vs [3] -> weight (4+5+2 + 1.8 = 12.8) vs 3.6 -> max 12.8
    // Best split is k=2: left=[0, 1], right=[2, 3]
    const res = partitionCategories([4, 5, 2, 3]);
    expect(res.left).toEqual([0, 1]);
    expect(res.right).toEqual([2, 3]);
    expect(res.leftItems).toBe(9);
    expect(res.rightItems).toBe(5);
  });
});

describe('chooseColumns', () => {
  it('returns 2 columns for mobile screens under 600px', () => {
    expect(chooseColumns(390)).toBe(2);
    expect(chooseColumns(412)).toBe(2);
    expect(chooseColumns(599)).toBe(2);
  });

  it('returns 3 columns for tablet screens >= 600px and < 900px', () => {
    expect(chooseColumns(600)).toBe(3);
    expect(chooseColumns(768)).toBe(3);
  });

  it('returns 4 columns for large displays >= 900px', () => {
    expect(chooseColumns(900)).toBe(4);
    expect(chooseColumns(1200)).toBe(4);
  });
});


describe('thresholds', () => {
  it('uses 52px / 56px: a 44px add button plus 4px above and below', () => {
    expect(MIN_BOARD_ROW_PX).toBe(52);
    expect(HYSTERESIS_BOARD_ROW_PX).toBe(56);
    expect(MIN_BOARD_ROW_PX).toBeGreaterThanOrEqual(44 + 2 * 4);
    expect(HYSTERESIS_BOARD_ROW_PX).toBeGreaterThan(MIN_BOARD_ROW_PX);
  });
});

describe('boardEstRowPx', () => {
  const chrome = DEFAULT_BOARD_CHROME; // header 34, gap 8, padY 16

  it('is 999 (unconstrained) for an empty menu or no height', () => {
    expect(boardEstRowPx(600, [])).toBe(999);
    expect(boardEstRowPx(0, [3, 3])).toBe(999);
  });

  it('subtracts card chrome, gaps and padding (hand-worked)', () => {
    // 2 categories, 4 items each: one card per column.
    // (400 - 16 padding - 0 gaps - 1 * 34 header) / 4 = 87.5
    expect(boardEstRowPx(400, [4, 4])).toBe(87.5);
    // 4 categories [2,2,2,2] -> 2 per column. (400 - 16 - 1*8 - 2*34) / 4 = 77
    expect(boardEstRowPx(400, [2, 2, 2, 2])).toBe(77);
  });

  it('measures the LIMITING column, not the column with more items', () => {
    // [3,3,3 | 10]: left = 3 cards / 9 items, right = 1 card / 10 items.
    // left : (500 - 16 - 2*8 - 3*34) / 9 = 40.67  <- smaller rows, fewer items
    // right: (500 - 16 - 0   - 1*34) / 10 = 45
    const part = partitionCategories([3, 3, 3, 10]);
    expect(part.leftItems).toBe(9);
    expect(part.rightItems).toBe(10);
    const est = boardEstRowPx(500, [3, 3, 3, 10]);
    expect(est).toBeCloseTo(40.667, 2);
    // the old formula ((menuH - cats*28) / tallerItems) said 47.2 for this menu
    expect(est).toBeLessThan((500 - 28) / 10);
  });

  it('a single category fills one column and is not halved', () => {
    expect(boardEstRowPx(400, [5])).toBe((400 - 16 - 34) / 5);
  });

  it('never goes negative when the chrome alone is taller than the area', () => {
    // 2 cards per column: chrome alone is 16 + 8 + 2*34 = 92px, more than the 60px given
    expect(boardEstRowPx(60, [5, 5, 5, 5])).toBe(0);
  });

  it('accepts partial chrome overrides', () => {
    const est = boardEstRowPx(600, [4, 4], { gap: 99 });   // gap is irrelevant with 1 card/column
    expect(est).toBe(boardEstRowPx(600, [4, 4]));
  });
});

describe('real devices (the sizes from the design handoff)', () => {
  // 18 items in 6 categories, 9 per column (3 + 3 cards)
  const eighteen = [4, 2, 3, 3, 4, 2];

  it('phone 390x844: board area 620px -> 54px rows -> stays a board', () => {
    const r = chooseLayout({ width: 390, height: 844 - 64 - 36 - 68 - 56, counts: eighteen });
    expect(r.mode).toBe('board');
    expect(r.estRowPx).toBe(54);
    expect(r.columns).toBe(2);
  });

  it('phone 360x640 with 18 items cannot fit 44px buttons -> focus', () => {
    const r = chooseLayout({ width: 360, height: 640 - 64 - 36 - 68 - 56, counts: eighteen });
    expect(r.mode).toBe('focus');
  });

  it('laptop 1440x900: 788px board -> ~69px rows -> board, 4 focus columns available', () => {
    // 900 tall - 64 top bar - 2 x 24 page padding
    const r = chooseLayout({ width: 1440, height: 900 - 64 - 48, counts: eighteen, chrome: LAPTOP_BOARD_CHROME });
    expect(r.mode).toBe('board');
    expect(r.estRowPx).toBe(69);
    expect(r.columns).toBe(4);
  });

  it('laptop 1280x720: the 18-item menu drops to focus (as the handoff predicts)', () => {
    const r = chooseLayout({ width: 1280, height: 720 - 64 - 48, counts: eighteen, chrome: LAPTOP_BOARD_CHROME });
    expect(r.mode).toBe('focus');
  });

  it('tablet 768x1024 gets 3 focus columns', () => {
    expect(chooseLayout({ width: 768, height: 400, counts: [10, 10, 10, 10] }).columns).toBe(3);
  });
});

describe('chooseLayout & hysteresis (52 / 56)', () => {
  // Craft a menu whose limiting-column row height we control exactly:
  // counts [10, 10] -> one card per column: (H - 16 - 34) / 10
  const heightFor = (rowPx: number) => rowPx * 10 + 16 + 34;
  const counts = [10, 10];

  it('chooses board when rows are comfortably above the floor', () => {
    const res = chooseLayout({ width: 390, height: 600, counts: [3, 3] });
    expect(res.mode).toBe('board');
    expect(res.estRowPx).toBeGreaterThanOrEqual(52);
  });

  it('chooses focus when a dense menu cannot give every row 52px', () => {
    expect(chooseLayout({ width: 390, height: 400, counts: [10, 8, 8, 4] }).mode).toBe('focus');
  });

  it('first load: exactly 52px is a board, 51px is focus', () => {
    expect(chooseLayout({ width: 390, height: heightFor(52), counts }).mode).toBe('board');
    expect(chooseLayout({ width: 390, height: heightFor(51), counts }).mode).toBe('focus');
  });

  it('a 44px button always fits in a board row (the whole point of 52)', () => {
    for (let h = 300; h <= 900; h += 7) {
      const r = chooseLayout({ width: 390, height: h, counts: [6, 6, 5, 5] });
      if (r.mode === 'board') expect(r.estRowPx).toBeGreaterThanOrEqual(44);
    }
  });

  it('hysteresis: from board it stays a board down to 52px', () => {
    for (const row of [52, 53, 55]) {
      expect(chooseLayout({ width: 390, height: heightFor(row), counts, prev: 'board' }).mode).toBe('board');
    }
  });

  it('hysteresis: from focus it does NOT return to board between 52 and 55px', () => {
    for (const row of [52, 53, 55]) {
      expect(chooseLayout({ width: 390, height: heightFor(row), counts, prev: 'focus' }).mode).toBe('focus');
    }
  });

  it('hysteresis: from focus it returns to board at 56px', () => {
    expect(chooseLayout({ width: 390, height: heightFor(56), counts, prev: 'focus' }).mode).toBe('board');
  });

  it('tablet-height rotation: 54px would flap under the old 38/42 numbers, not under 52/56', () => {
    const h = heightFor(54);
    const a = chooseLayout({ width: 390, height: h, counts, prev: 'board' });
    const b = chooseLayout({ width: 390, height: h, counts, prev: a.mode });
    expect(a.mode).toBe('board');
    expect(b.mode).toBe('board');
  });

  it('empty menu is a board with no rows', () => {
    expect(chooseLayout({ width: 390, height: 600, counts: [] })).toEqual({ mode: 'board', estRowPx: 0, columns: 2 });
  });
});

describe('focusEstRowPx', () => {
  it('uses one open bar (56) plus closed bars (60) and gaps', () => {
    expect(FOCUS_OPEN_BAR_H).toBe(56);
    expect(FOCUS_CLOSED_BAR_H).toBe(60);
    // 4 categories, largest 8 items, 2 columns -> 4 grid rows.
    // bars = 56 + 3*60 + 3*8 = 260 ; padY 16 ; (600 - 16 - 260) / 4 = 81
    expect(focusEstRowPx(600, [8, 4, 4, 2], 2)).toBe(81);
  });
  it('is 0 when the bars alone do not fit', () => {
    expect(focusEstRowPx(200, [8, 4, 4, 2], 2)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property tests (seeded, so a failure is reproducible)
// ─────────────────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Independent model of the CSS: flex columns where each card keeps its chrome and shares the rest by item count. */
function simulateRenderedRows(H: number, counts: number[], c: BoardChrome): number {
  const { left, right } = partitionCategories(counts);
  const rows: number[] = [];
  for (const col of [left, right]) {
    if (col.length === 0) continue;
    const items = col.reduce((sum, i) => sum + counts[i], 0);
    const free = H - c.padY - (col.length - 1) * c.gap - col.length * c.catHeaderH; // grows by flex-grow = items
    const perItem = free / items;
    for (const i of col) rows.push((c.catHeaderH + counts[i] * perItem - c.catHeaderH) / counts[i]);
  }
  return Math.max(0, Math.min(...rows));
}

describe('properties', () => {
  const rand = mulberry32(20260508);
  const randCounts = () => Array.from({ length: 1 + Math.floor(rand() * 7) }, () => 1 + Math.floor(rand() * 9));
  const cases = Array.from({ length: 200 }, () => ({
    counts: randCounts(),
    height: 250 + Math.floor(rand() * 800),
    chrome: rand() < 0.5 ? DEFAULT_BOARD_CHROME : LAPTOP_BOARD_CHROME,
  }));

  it('the estimate equals what an independent model of the CSS draws (200 random menus)', () => {
    for (const { counts, height, chrome } of cases) {
      expect(boardEstRowPx(height, counts, chrome)).toBeCloseTo(simulateRenderedRows(height, counts, chrome), 6);
    }
  });

  it('more height never shrinks rows (monotonic)', () => {
    for (const { counts, height, chrome } of cases) {
      expect(boardEstRowPx(height + 40, counts, chrome)).toBeGreaterThanOrEqual(boardEstRowPx(height, counts, chrome));
    }
  });

  it('adding an item never grows rows while the column split stays the same', () => {
    // (Adding an item can move the split to a better one, so this only holds for a fixed split.)
    let checked = 0;
    for (const { counts, height, chrome } of cases) {
      const more = counts.map((n, i) => (i === 0 ? n + 1 : n));
      const a = partitionCategories(counts), b = partitionCategories(more);
      if (JSON.stringify(a.left) !== JSON.stringify(b.left)) continue;
      checked++;
      expect(boardEstRowPx(height, more, chrome)).toBeLessThanOrEqual(boardEstRowPx(height, counts, chrome) + 1e-9);
    }
    expect(checked).toBeGreaterThan(50);   // make sure the property was actually exercised
  });

  it('is stable: feeding the result back as `prev` never changes the mode (no flapping)', () => {
    for (const { counts, height, chrome } of cases) {
      const first = chooseLayout({ width: 390, height, counts, chrome });
      const again = chooseLayout({ width: 390, height, counts, chrome, prev: first.mode });
      expect(again.mode).toBe(first.mode);
    }
  });

  it('whenever it picks board, rows are >= 52px; whenever it picks focus from board, the board estimate was < 52', () => {
    for (const { counts, height, chrome } of cases) {
      const r = chooseLayout({ width: 390, height, counts, chrome, prev: 'board' });
      const est = boardEstRowPx(height, counts, chrome);
      if (r.mode === 'board') expect(est).toBeGreaterThanOrEqual(MIN_BOARD_ROW_PX - 0.5);
      else expect(est).toBeLessThan(MIN_BOARD_ROW_PX);
    }
  });
});
