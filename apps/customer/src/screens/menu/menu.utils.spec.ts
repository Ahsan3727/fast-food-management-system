import { describe, it, expect } from 'vitest';
import {
  deriveMenuState, isComplex, minDisplayPrice, showFrom, itemCaption, secondaryLine,
  normalizeQuery, matchesQuery, findMatch, countMatches, firstMatchingCategoryId, hasNoMatches,
  resolveCatParam, badgeLabel,
  type MenuState, type QuerySnapshot,
} from './menu.utils';

// Query snapshots as TanStack Query v5 actually reports them.
const fetching: QuerySnapshot = { status: 'pending', fetchStatus: 'fetching', data: undefined };
const paused:   QuerySnapshot = { status: 'pending', fetchStatus: 'paused',   data: undefined };
const failed:   QuerySnapshot = { status: 'error',   fetchStatus: 'idle',     data: undefined };
const loaded:   QuerySnapshot = { status: 'success', fetchStatus: 'idle',     data: [] };

// A refetch that failed AFTER a successful load: v5 reports status 'error'
// but keeps the old data. The stale menu must stay on screen.
const staleAfterFailedRefetch: QuerySnapshot = { status: 'error', fetchStatus: 'idle', data: [] };
// Warm cache while the device is offline: data present, refetch paused.
const warmButOffline: QuerySnapshot = { status: 'success', fetchStatus: 'paused', data: [] };

interface Row {
  name: string;
  cats: QuerySnapshot;
  items: QuerySnapshot;
  activeCatCount?: number;
  expected: MenuState;
}

const rows: Row[] = [
  // ── loading ────────────────────────────────────────────────────────────
  { name: 'both queries still fetching',                    cats: fetching, items: fetching, expected: 'loading' },
  { name: 'items loaded, categories still fetching (used to flash "empty")',
                                                            cats: fetching, items: loaded,   expected: 'loading' },
  { name: 'categories loaded, items still fetching',        cats: loaded,   items: fetching, expected: 'loading' },

  // ── offline ────────────────────────────────────────────────────────────
  { name: 'cold start offline: both queries paused',        cats: paused,   items: paused,   expected: 'offline' },
  { name: 'only the items query is paused',                 cats: loaded,   items: paused,   expected: 'offline' },
  { name: 'offline wins over error when both apply',        cats: failed,   items: paused,   expected: 'offline' },

  // ── error ──────────────────────────────────────────────────────────────
  { name: 'items request failed',                           cats: loaded,   items: failed,   expected: 'error' },
  { name: 'categories request failed but items succeeded',  cats: failed,   items: loaded,   activeCatCount: 0, expected: 'error' },
  { name: 'both requests failed',                           cats: failed,   items: failed,   expected: 'error' },
  { name: 'one failed while the other is still fetching',   cats: failed,   items: fetching, expected: 'error' },

  // ── has data: stale data is better than no data ────────────────────────
  { name: 'refetch failed after a good load keeps the menu',cats: loaded,   items: staleAfterFailedRefetch, activeCatCount: 3, expected: 'ready' },
  { name: 'warm cache while offline keeps the menu',        cats: warmButOffline, items: warmButOffline, activeCatCount: 3, expected: 'ready' },

  // ── empty vs ready ─────────────────────────────────────────────────────
  { name: 'loaded fine but nothing to show',                cats: loaded,   items: loaded,   activeCatCount: 0, expected: 'empty' },
  { name: 'loaded with at least one active category',       cats: loaded,   items: loaded,   activeCatCount: 1, expected: 'ready' },
];

describe('deriveMenuState', () => {
  it.each(rows)('$name -> $expected', ({ cats, items, activeCatCount = 1, expected }) => {
    expect(deriveMenuState({ cats, items, activeCatCount })).toBe(expected);
  });

  it('never reports "empty" while a query has not produced data', () => {
    // Regression guard for the original bug: failed/offline/loading all
    // looked like an empty menu because `items` defaulted to [].
    for (const q of [fetching, paused, failed]) {
      expect(deriveMenuState({ cats: loaded, items: q, activeCatCount: 0 })).not.toBe('empty');
      expect(deriveMenuState({ cats: q, items: loaded, activeCatCount: 0 })).not.toBe('empty');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M1: item helpers
// ─────────────────────────────────────────────────────────────────────────────

const size = (label: string, price: number) => ({ label, price });
const plain      = { basePrice: 18000, sizes: [], addOns: [] };
const sizesOnly  = { basePrice: 35000, sizes: [size('Regular', 35000), size('Double', 55000)], addOns: [] };
const addOnsOnly = { basePrice: 35000, sizes: [], addOns: [size('Extra Cheese', 5000), size('Bacon', 8000)] };
const both       = { basePrice: 35000, sizes: [size('Regular', 35000), size('Double', 55000)], addOns: [size('Extra Cheese', 5000), size('Bacon', 8000)] };

describe('showFrom (was isComplex, which wrongly showed "from" for add-ons-only items)', () => {
  it('is false for a plain item', () => expect(showFrom(plain)).toBe(false));
  it('is true when there are sizes', () => expect(showFrom(sizesOnly)).toBe(true));
  it('is FALSE for an add-ons-only item: the price does not vary', () => {
    expect(isComplex(addOnsOnly)).toBe(true);   // it still opens the sheet
    expect(showFrom(addOnsOnly)).toBe(false);   // but its price is not "from"
  });
  it('is true for sizes plus add-ons', () => expect(showFrom(both)).toBe(true));
});

describe('isComplex', () => {
  it.each([
    { name: 'plain',       item: plain,      expected: false },
    { name: 'sizes only',  item: sizesOnly,  expected: true  },
    { name: 'add-ons only', item: addOnsOnly, expected: true  },
    { name: 'both',        item: both,       expected: true  },
  ])('$name -> $expected', ({ item, expected }) => expect(isComplex(item)).toBe(expected));
});

describe('minDisplayPrice', () => {
  it('is the base price without sizes', () => expect(minDisplayPrice(plain)).toBe(18000));
  it('is the cheapest size', () => expect(minDisplayPrice(sizesOnly)).toBe(35000));
  it('never exceeds the base price', () => {
    expect(minDisplayPrice({ basePrice: 30000, sizes: [size('S', 40000), size('L', 50000)] })).toBe(30000);
  });
});

describe('itemCaption', () => {
  it.each([
    { name: 'no options',          item: plain,      expected: '' },
    { name: 'sizes only',          item: sizesOnly,  expected: '2 sizes' },
    { name: 'add-ons only',        item: addOnsOnly, expected: '2 add-ons' },
    { name: 'sizes and add-ons',   item: both,       expected: '2 sizes · 2 add-ons' },
    { name: 'singular size',       item: { sizes: [size('Only', 1)], addOns: [] }, expected: '1 size' },
    { name: 'singular add-on',     item: { sizes: [], addOns: [size('Ice', 1)] },   expected: '1 add-on' },
  ])('$name -> "$expected"', ({ item, expected }) => expect(itemCaption(item)).toBe(expected));
});

describe('secondaryLine', () => {
  it('prefers the options caption over the description', () => {
    expect(secondaryLine({ ...both, description: 'Beef patty' })).toBe('2 sizes · 2 add-ons');
  });
  it('falls back to the description', () => {
    expect(secondaryLine({ ...plain, description: 'Crispy chicken fillet' })).toBe('Crispy chicken fillet');
  });
  it('is empty (so the row omits the line) when there is nothing to say', () => {
    expect(secondaryLine({ ...plain })).toBe('');
    expect(secondaryLine({ ...plain, description: '   ' })).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M1: the single search predicate
// ─────────────────────────────────────────────────────────────────────────────

describe('matchesQuery', () => {
  const zinger = { name: 'Zinger Burger', description: 'Crispy chicken fillet with jalapeños' };
  const cola   = { name: 'Cola' };

  it('matches everything when the query is empty or only spaces', () => {
    expect(matchesQuery(zinger, '')).toBe(true);
    expect(matchesQuery(zinger, '   ')).toBe(true);
  });
  it('is case-insensitive on the name', () => expect(matchesQuery(zinger, 'ZIN')).toBe(true));
  it('matches the description too', () => expect(matchesQuery(zinger, 'jalape')).toBe(true));
  it('ignores surrounding spaces ("zin " matched in only some places before)', () => {
    expect(matchesQuery(zinger, 'zin ')).toBe(true);
    expect(matchesQuery(zinger, ' zin')).toBe(true);
  });
  it('does not match unrelated text', () => expect(matchesQuery(zinger, 'pizza')).toBe(false));
  it('handles an item with no description', () => {
    expect(matchesQuery(cola, 'col')).toBe(true);
    expect(matchesQuery(cola, 'fillet')).toBe(false);
  });
});

describe('findMatch (highlight range)', () => {
  it('returns the first occurrence, case-insensitively', () => {
    expect(findMatch('Zinger Burger', 'ZIN')).toEqual({ start: 0, end: 3 });
    expect(findMatch('Classic Burger', 'burg')).toEqual({ start: 8, end: 12 });
  });
  it('uses the trimmed query length so the highlight does not swallow a space', () => {
    expect(findMatch('Zinger Burger', 'zin ')).toEqual({ start: 0, end: 3 });
  });
  it('is null for no match or an empty query', () => {
    expect(findMatch('Cola', 'pizza')).toBe(null);
    expect(findMatch('Cola', '')).toBe(null);
    expect(findMatch('Cola', '  ')).toBe(null);
  });
});

describe('normalizeQuery', () => {
  it('trims and lower-cases', () => expect(normalizeQuery('  ZiN  ')).toBe('zin'));
});

describe('countMatches / firstMatchingCategoryId / hasNoMatches', () => {
  const grouped = new Map([
    ['c1', [{ name: 'Classic Burger' }, { name: 'Zinger Burger', description: 'Crispy' }]],
    ['c2', [{ name: 'Fries' }]],
    ['c3', [{ name: 'Cola' }, { name: 'Zesty Lemonade' }]],
  ]);
  const cats = [{ _id: 'c1' }, { _id: 'c2' }, { _id: 'c3' }];

  it('counts matches in one category', () => {
    expect(countMatches(grouped.get('c1')!, 'burger')).toBe(2);
    expect(countMatches(grouped.get('c1')!, 'zin')).toBe(1);
    expect(countMatches(grouped.get('c1')!, '')).toBe(0);   // no search -> no badge
  });
  it('finds the first matching category in display order', () => {
    expect(firstMatchingCategoryId(cats, grouped, 'z')).toBe('c1');
    expect(firstMatchingCategoryId(cats, grouped, 'lemon')).toBe('c3');
    expect(firstMatchingCategoryId(cats, grouped, 'sushi')).toBeUndefined();
    expect(firstMatchingCategoryId(cats, grouped, '')).toBeUndefined();
  });
  it('knows when nothing at all matches', () => {
    expect(hasNoMatches(grouped, 'sushi')).toBe(true);
    expect(hasNoMatches(grouped, 'cola')).toBe(false);
    expect(hasNoMatches(grouped, '')).toBe(false);          // no search is never "no matches"
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M1: ?cat= deep link
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveCatParam (?cat= from HomeScreen)', () => {
  const active = [{ _id: 'c1' }, { _id: 'c2' }];
  it('accepts an id of a category we are showing', () => expect(resolveCatParam('c2', active)).toBe('c2'));
  it('ignores an unknown id (deleted or hidden category)', () => expect(resolveCatParam('zzz', active)).toBe(null));
  it('ignores a missing or empty param', () => {
    expect(resolveCatParam(null, active)).toBe(null);
    expect(resolveCatParam(undefined, active)).toBe(null);
    expect(resolveCatParam('', active)).toBe(null);
  });
  it('ignores everything while there are no categories yet', () => expect(resolveCatParam('c1', [])).toBe(null));
});

describe('badgeLabel (count on the add button)', () => {
  it.each([
    { n: 1,   expected: '1' },
    { n: 9,   expected: '9' },
    { n: 99,  expected: '99' },
    { n: 100, expected: '99+' },
    { n: 250, expected: '99+' },
    { n: 0,   expected: '0' },
  ])('$n -> $expected', ({ n, expected }) => expect(badgeLabel(n)).toBe(expected));
});
