import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, lineKey } from './cart.store';

const memoryStore: Record<string, string> = {};
if (typeof window !== 'undefined') {
  (window as any).localStorage = {
    getItem: (k: string) => memoryStore[k] ?? null,
    setItem: (k: string, v: string) => { memoryStore[k] = v; },
    removeItem: (k: string) => { delete memoryStore[k]; },
    clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); },
  };
} else if (typeof global !== 'undefined') {
  (global as any).localStorage = {
    getItem: (k: string) => memoryStore[k] ?? null,
    setItem: (k: string, v: string) => { memoryStore[k] = v; },
    removeItem: (k: string) => { delete memoryStore[k]; },
    clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); },
  };
}

describe('cart.store and lineKey (Phase 1 & 5)', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it('produces distinct lineKey for identical item with different sizes or add-ons', () => {
    const item1 = { menuItemId: 'item-1', sizeLabel: 'Regular', addOns: ['Cheese'] };
    const item2 = { menuItemId: 'item-1', sizeLabel: 'Large', addOns: ['Cheese'] };
    const item3 = { menuItemId: 'item-1', sizeLabel: 'Regular', addOns: ['Bacon', 'Cheese'] };
    const item4 = { menuItemId: 'item-1', sizeLabel: 'Regular', addOns: ['Cheese', 'Bacon'] };

    expect(lineKey(item1)).not.toBe(lineKey(item2));
    expect(lineKey(item1)).not.toBe(lineKey(item3));
    // Add-on order sorted canonical form ensures same lineKey
    expect(lineKey(item3)).toBe(lineKey(item4));
  });

  it('stores distinct combinations on independent lines without merging', () => {
    const store = useCartStore.getState();

    store.addItem({
      menuItemId: 'item-burger',
      name: 'Burger',
      sizeLabel: 'Single',
      addOns: ['Cheese'],
      unitPricePaisa: 500,
      quantity: 1,
    });

    store.addItem({
      menuItemId: 'item-burger',
      name: 'Burger',
      sizeLabel: 'Double',
      addOns: ['Cheese'],
      unitPricePaisa: 800,
      quantity: 2,
    });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].sizeLabel).toBe('Single');
    expect(items[0].quantity).toBe(1);
    expect(items[1].sizeLabel).toBe('Double');
    expect(items[1].quantity).toBe(2);
  });

  it('increments quantity when exact same line variation is added', () => {
    const store = useCartStore.getState();

    store.addItem({
      menuItemId: 'item-pizza',
      name: 'Pizza',
      sizeLabel: 'Large',
      addOns: ['Olives'],
      unitPricePaisa: 1200,
      quantity: 1,
    });

    store.addItem({
      menuItemId: 'item-pizza',
      name: 'Pizza',
      sizeLabel: 'Large',
      addOns: ['Olives'],
      unitPricePaisa: 1200,
      quantity: 2,
    });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it('removes exact line by lineKey', () => {
    const store = useCartStore.getState();

    const itemA = {
      menuItemId: 'item-fries',
      name: 'Fries',
      sizeLabel: 'Small',
      addOns: [],
      unitPricePaisa: 300,
      quantity: 1,
    };
    const itemB = {
      menuItemId: 'item-fries',
      name: 'Fries',
      sizeLabel: 'Large',
      addOns: [],
      unitPricePaisa: 500,
      quantity: 1,
    };

    store.addItem(itemA);
    store.addItem(itemB);

    expect(useCartStore.getState().items).toHaveLength(2);

    store.removeItem(lineKey(itemA));

    const remaining = useCartStore.getState().items;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].sizeLabel).toBe('Large');
  });

  it('updates quantity by lineKey and removes when reaching zero', () => {
    const store = useCartStore.getState();

    const item = {
      menuItemId: 'item-drink',
      name: 'Drink',
      addOns: [],
      unitPricePaisa: 150,
      quantity: 2,
    };

    store.addItem(item);
    const key = lineKey(item);

    store.updateQuantity(key, -1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    store.updateQuantity(key, -1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
