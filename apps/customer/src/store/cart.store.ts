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

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string, sizeLabel?: string) => void;
  updateQuantity: (menuItemId: string, sizeLabel: string | undefined, delta: number) => void;
  clear: () => void;
  totalItems: () => number;
  displayTotalPaisa: () => number; // estimate only
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          const key = `${newItem.menuItemId}:${newItem.sizeLabel}`;
          const exists = state.items.find(
            (i) => `${i.menuItemId}:${i.sizeLabel}` === key,
          );
          if (exists) {
            return {
              items: state.items.map((i) =>
                `${i.menuItemId}:${i.sizeLabel}` === key
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (menuItemId, sizeLabel) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.menuItemId === menuItemId && i.sizeLabel === sizeLabel),
          ),
        }));
      },

      updateQuantity: (menuItemId, sizeLabel, delta) => {
        set((state) => ({
          items: state.items
            .map((i) =>
              i.menuItemId === menuItemId && i.sizeLabel === sizeLabel
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
    { name: 'fastfood-cart' },
  ),
);
