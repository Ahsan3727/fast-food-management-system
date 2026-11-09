import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MAX_LINE_QTY } from '@fastfood/shared-types';

export interface CartItem {
  menuItemId: string;
  name: string;
  image?: string;
  emoji?: string;
  sizeLabel?: string;
  addOns: string[];
  unitPricePaisa: number; // display only — server recalculates
  quantity: number;
}

export const lineKey = (i: { menuItemId: string; sizeLabel?: string; addOns?: string[] }) =>
  `${i.menuItemId}|${i.sizeLabel ?? ''}|${[...(i.addOns ?? [])].sort().join(',')}`;

/** Cap a running quantity at what the API will accept (it rejects > MAX_LINE_QTY with a 400). */
const capQty = (n: number) => Math.min(MAX_LINE_QTY, n);

/**
 * Upgrade a cart saved by an older app version. Exported so it can be tested
 * without touching localStorage.
 *  v1 -> v2: lines gained an `addOns` array.
 *  v2 -> v3: quantities are clamped to MAX_LINE_QTY. Before this, a cart could
 *            hold 21+ of one line and then fail checkout with a 400.
 */
export function migrateCart(persistedState: any, version: number): any {
  if (!persistedState?.items) return persistedState;
  let items = persistedState.items as any[];
  if (version < 2) {
    items = items.map((item) => ({
      ...item,
      addOns: Array.isArray(item.addOns) ? item.addOns : [],
    }));
  }
  if (version < 3) {
    items = items.map((item) => ({
      ...item,
      quantity: Number.isFinite(item.quantity) && item.quantity >= 1
        ? Math.min(MAX_LINE_QTY, Math.floor(item.quantity))
        : 1,
    }));
  }
  return { ...persistedState, items };
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (keyOrMenuItemId: string, sizeLabel?: string) => void;
  updateQuantity: (
    keyOrMenuItemId: string,
    deltaOrSizeLabel: number | string | undefined,
    maybeDelta?: number,
  ) => void;
  clear: () => void;
  totalItems: () => number;
  displayTotalPaisa: () => number; // estimate only
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const itemWithDefaults: CartItem = {
          ...newItem,
          addOns: Array.isArray(newItem.addOns) ? newItem.addOns : [],
        };
        const key = lineKey(itemWithDefaults);

        set((state) => {
          const exists = state.items.find((i) => lineKey(i) === key);
          if (exists) {
            return {
              items: state.items.map((i) =>
                lineKey(i) === key
                  ? { ...i, quantity: capQty(i.quantity + itemWithDefaults.quantity) }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...itemWithDefaults, quantity: capQty(itemWithDefaults.quantity) },
            ],
          };
        });
      },

      removeItem: (keyOrMenuItemId, sizeLabel) => {
        set((state) => ({
          items: state.items.filter((i) => {
            if (sizeLabel !== undefined) {
              return !(i.menuItemId === keyOrMenuItemId && i.sizeLabel === sizeLabel);
            }
            return lineKey(i) !== keyOrMenuItemId;
          }),
        }));
      },

      updateQuantity: (keyOrMenuItemId, deltaOrSizeLabel, maybeDelta) => {
        let targetKey: string;
        let delta: number;

        if (typeof deltaOrSizeLabel === 'number') {
          targetKey = keyOrMenuItemId;
          delta = deltaOrSizeLabel;
        } else {
          // Legacy signature: (menuItemId, sizeLabel, delta)
          delta = maybeDelta ?? 0;
          set((state) => ({
            items: state.items
              .map((i) =>
                i.menuItemId === keyOrMenuItemId && i.sizeLabel === deltaOrSizeLabel
                  ? { ...i, quantity: capQty(i.quantity + delta) }
                  : i,
              )
              .filter((i) => i.quantity > 0),
          }));
          return;
        }

        set((state) => ({
          items: state.items
            .map((i) =>
              lineKey(i) === targetKey
                ? { ...i, quantity: capQty(i.quantity + delta) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        }));
      },

      clear: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      displayTotalPaisa: () =>
        get().items.reduce((sum, i) => sum + i.unitPricePaisa * i.quantity, 0),
    }),
    {
      name: 'fastfood-cart',
      version: 3,
      migrate: migrateCart,
    },
  ),
);
