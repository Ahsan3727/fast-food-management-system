import { describe, it, expect, beforeEach } from 'vitest';
import { MAX_LINE_QTY } from '@fastfood/shared-types';
import { useCartStore, lineKey, migrateCart } from './cart.store';

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

describe('quantity cap (MAX_LINE_QTY, F7)', () => {
  const line = (quantity: number) => ({
    menuItemId: 'item-cola', name: 'Cola', addOns: [], unitPricePaisa: 8000, quantity,
  });

  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it('matches the API limit of 20', () => {
    expect(MAX_LINE_QTY).toBe(20);
  });

  it('refuses a 21st add to the same line', () => {
    const store = useCartStore.getState();
    store.addItem(line(MAX_LINE_QTY));
    store.addItem(line(1));
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_LINE_QTY);
  });

  it('caps a brand-new line that arrives over the limit', () => {
    useCartStore.getState().addItem(line(35));
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_LINE_QTY);
  });

  it('caps a merge that would overshoot (18 + 5 -> 20)', () => {
    const store = useCartStore.getState();
    store.addItem(line(18));
    store.addItem(line(5));
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_LINE_QTY);
  });

  it('does not let the stepper (updateQuantity) go past the limit', () => {
    const store = useCartStore.getState();
    store.addItem(line(MAX_LINE_QTY));
    store.updateQuantity(lineKey(line(1)), +1);
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_LINE_QTY);
    // legacy (menuItemId, sizeLabel, delta) signature too
    store.updateQuantity('item-cola', undefined as unknown as string, +1);
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_LINE_QTY);
  });

  it('still lets quantities go down and the line disappear at zero', () => {
    const store = useCartStore.getState();
    store.addItem(line(MAX_LINE_QTY));
    store.updateQuantity(lineKey(line(1)), -1);
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_LINE_QTY - 1);
    store.updateQuantity(lineKey(line(1)), -(MAX_LINE_QTY - 1));
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('migrateCart (persist version 3)', () => {
  const saved = (quantity: number, extra: object = {}) => ({
    state: undefined,
    items: [{ menuItemId: 'a', name: 'A', addOns: [], unitPricePaisa: 100, quantity, ...extra }],
  });

  it('clamps a stored cart line of 30 down to 20', () => {
    const out = migrateCart(saved(30), 2);
    expect(out.items[0].quantity).toBe(20);
  });

  it('leaves quantities within the limit untouched', () => {
    const out = migrateCart(saved(3), 2);
    expect(out.items[0].quantity).toBe(3);
  });

  it('repairs quantities that cannot be sent to the API (0, negative, NaN, fraction)', () => {
    expect(migrateCart(saved(0), 2).items[0].quantity).toBe(1);
    expect(migrateCart(saved(-4), 2).items[0].quantity).toBe(1);
    expect(migrateCart(saved(NaN), 2).items[0].quantity).toBe(1);
    expect(migrateCart(saved(4.7), 2).items[0].quantity).toBe(4);
  });

  it('still upgrades a version-1 cart (adds addOns) and clamps it in one pass', () => {
    const v1 = { items: [{ menuItemId: 'a', name: 'A', unitPricePaisa: 100, quantity: 50 }] };
    const out = migrateCart(v1, 1);
    expect(out.items[0].addOns).toEqual([]);
    expect(out.items[0].quantity).toBe(20);
  });

  it('keeps every other field and tolerates an empty or missing cart', () => {
    const out = migrateCart({ ...saved(2), theme: 'x' }, 2);
    expect(out.theme).toBe('x');
    expect(out.items[0].unitPricePaisa).toBe(100);
    expect(migrateCart(undefined, 2)).toBe(undefined);
    expect(migrateCart({}, 2)).toEqual({});
  });
});
