/**
 * Pure menu helpers. deriveMenuState is the M0 load-state switch;
 * more item helpers land in M1.
 */

export type MenuViewState = 'loading' | 'offline' | 'error' | 'empty' | 'ready';

export interface MenuQuerySlice<T = unknown> {
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  fetchStatus: 'fetching' | 'paused' | 'idle';
  data: T[] | undefined;
}

export interface MenuCatSlice {
  _id: string;
  isActive?: boolean;
}

export interface MenuItemSlice {
  categoryId: string;
}

export function hasRenderableMenu(
  cats: MenuCatSlice[],
  items: MenuItemSlice[],
): boolean {
  if (cats.length === 0 || items.length === 0) return false;
  const itemCatIds = new Set(items.map(i => i.categoryId));
  return cats.some(c => c.isActive !== false && itemCatIds.has(c._id));
}

/**
 * One derived view state for MenuScreen.
 *
 * Offline is checked before empty: a paused TanStack v5 query has
 * isLoading=false and no data, which used to fall through to "Menu is empty".
 * Either query failing is error even if the other succeeded.
 */
export function deriveMenuState(input: {
  cats: MenuQuerySlice<MenuCatSlice>;
  items: MenuQuerySlice<MenuItemSlice>;
}): MenuViewState {
  const { cats, items } = input;
  const catsReady = cats.data !== undefined;
  const itemsReady = items.data !== undefined;
  const bothHaveData = catsReady && itemsReady;

  const pausedWithoutData =
    (cats.fetchStatus === 'paused' && !catsReady) ||
    (items.fetchStatus === 'paused' && !itemsReady);

  if (pausedWithoutData) return 'offline';

  if (cats.isError || items.isError) return 'error';

  if (!bothHaveData) return 'loading';

  if (hasRenderableMenu(cats.data ?? [], items.data ?? [])) return 'ready';
  return 'empty';
}
