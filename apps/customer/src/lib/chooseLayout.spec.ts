import { describe, it, expect } from 'vitest';
import {
  partitionCategories,
  boardEstRowPx,
  chooseColumns,
  chooseLayout,
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

describe('chooseLayout & hysteresis', () => {
  it('chooses board mode when row height is well above 38px', () => {
    // Small menu (2 categories with 3 items each) in a 600px area
    const res = chooseLayout({
      width: 390,
      height: 600,
      counts: [3, 3],
    });
    expect(res.mode).toBe('board');
    expect(res.estRowPx).toBeGreaterThanOrEqual(38);
  });

  it('chooses focus mode when estimated board row drops below 38px', () => {
    // Dense menu (30 items total across 4 categories) in a small 400px area
    const res = chooseLayout({
      width: 390,
      height: 400,
      counts: [10, 8, 8, 4],
    });
    expect(res.mode).toBe('focus');
  });

  it('exhibits hysteresis: does not switch back to board mode until 42px', () => {
    // If boardEstRowPx is between 38px and 41px, and previous was focus, stay in focus
    // Available height: 500px, counts: [6, 6]
    // board taller column has 6 items + 1 header = (500 - 28) / 6 = 78px (would be board)
    // Let's create a boundary case around ~40px:
    // (menuH - 28) / items = 40 => menuH = 40 * items + 28
    // With 10 items: 400 + 28 = 428px -> row is (428 - 28) / 10 = 40px
    const boundaryHeight = 428;
    const counts = [10, 10];
    const est = boardEstRowPx(boundaryHeight, counts);
    expect(est).toBe(40);

    // Initial / prev='board': 40px is >= 38px -> stays board
    const resFromBoard = chooseLayout({
      width: 390,
      height: boundaryHeight,
      counts,
      prev: 'board',
    });
    expect(resFromBoard.mode).toBe('board');

    // Prev='focus': 40px is < 42px -> stays in focus mode to prevent layout jitter!
    const resFromFocus = chooseLayout({
      width: 390,
      height: boundaryHeight,
      counts,
      prev: 'focus',
    });
    expect(resFromFocus.mode).toBe('focus');
  });
});
