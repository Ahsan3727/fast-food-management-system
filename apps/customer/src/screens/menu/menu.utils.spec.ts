import { describe, expect, it } from 'vitest';
import {
  deriveMenuState,
  type MenuQuerySlice,
  type MenuCatSlice,
  type MenuItemSlice,
} from './menu.utils';

const catsData: MenuCatSlice[] = [{ _id: 'burgers', isActive: true }];
const itemsData: MenuItemSlice[] = [{ categoryId: 'burgers' }];

function slice<T>(
  over: Partial<MenuQuerySlice<T>> = {},
): MenuQuerySlice<T> {
  return {
    isPending: false,
    isFetching: false,
    isError: false,
    fetchStatus: 'idle',
    data: undefined,
    ...over,
  };
}

const loading: MenuQuerySlice = slice({
  isPending: true,
  isFetching: true,
  fetchStatus: 'fetching',
});

const paused: MenuQuerySlice = slice({
  isPending: true,
  isFetching: false,
  fetchStatus: 'paused',
});

describe('deriveMenuState', () => {
  it.each([
    {
      name: 'both queries pending and fetching → loading',
      cats: loading,
      items: loading,
      want: 'loading',
    },
    {
      name: 'items still fetching, categories already succeeded → loading',
      cats: slice({ data: catsData }),
      items: loading,
      want: 'loading',
    },
    {
      name: 'categories still fetching, items already succeeded → loading',
      cats: loading,
      items: slice({ data: itemsData }),
      want: 'loading',
    },
    {
      name: 'both succeeded with a renderable menu → ready',
      cats: slice({ data: catsData }),
      items: slice({ data: itemsData }),
      want: 'ready',
    },
    {
      name: 'both succeeded with empty arrays → empty',
      cats: slice({ data: [] }),
      items: slice({ data: [] }),
      want: 'empty',
    },
    {
      name: 'categories exist but no items → empty',
      cats: slice({ data: catsData }),
      items: slice({ data: [] }),
      want: 'empty',
    },
    {
      name: 'categories fail, items succeed → error',
      cats: slice({ isError: true, isPending: false }),
      items: slice({ data: itemsData }),
      want: 'error',
    },
    {
      name: 'items fail, categories succeed → error',
      cats: slice({ data: catsData }),
      items: slice({ isError: true, isPending: false }),
      want: 'error',
    },
    {
      name: 'both queries failed → error',
      cats: slice({ isError: true }),
      items: slice({ isError: true }),
      want: 'error',
    },
    {
      name: 'query paused offline with no data → offline (not empty)',
      cats: paused,
      items: paused,
      want: 'offline',
    },
    {
      name: 'paused with cached data → ready (warm offline)',
      cats: slice({ fetchStatus: 'paused', data: catsData }),
      items: slice({ fetchStatus: 'paused', data: itemsData }),
      want: 'ready',
    },
  ] as const)('$name', ({ cats, items, want }) => {
    expect(deriveMenuState({ cats, items })).toBe(want);
  });
});
