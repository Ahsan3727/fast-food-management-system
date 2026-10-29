import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
                  ? { ...i, quantity: i.quantity + itemWithDefaults.quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, itemWithDefaults] };
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
                  ? { ...i, quantity: i.quantity + delta }
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
                ? { ...i, quantity: i.quantity + delta }
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
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2 && persistedState?.items) {
          const items = (persistedState.items as any[]).map((item) => ({
            ...item,
            addOns: Array.isArray(item.addOns) ? item.addOns : [],
          }));
          return { ...persistedState, items };
        }
        return persistedState;
      },
    },
  ),
);
