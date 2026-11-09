/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ItemDetailSheet } from './ItemDetailSheet';
import type { MenuItem } from './MenuScreen';

vi.mock('@/store/cart.store', () => ({
  useCartStore: () => ({ addItem: vi.fn() }),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn() },
}));

vi.mock('@/components/Icon', () => ({
  Icon: () => null,
}));

vi.mock('./ItemDetailSheet.module.css', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

const burger: MenuItem = {
  _id: '1',
  name: 'Classic Burger',
  categoryId: 'c1',
  basePrice: 50000,
  isAvailable: true,
  sizes: [],
  addOns: [],
};

describe('ItemDetailSheet', () => {
  it('opens after mounting closed, closes, and reopens without crashing', () => {
    const onClose = vi.fn();
    const onAdded = vi.fn();
    const { rerender } = render(
      <ItemDetailSheet item={null} onClose={onClose} onAdded={onAdded} />,
    );
    expect(screen.queryByRole('dialog')).toBeNull();

    rerender(<ItemDetailSheet item={burger} onClose={onClose} onAdded={onAdded} />);
    expect(screen.getByRole('dialog', { name: 'Classic Burger' })).toBeTruthy();

    rerender(<ItemDetailSheet item={null} onClose={onClose} onAdded={onAdded} />);
    expect(screen.queryByRole('dialog')).toBeNull();

    rerender(<ItemDetailSheet item={burger} onClose={onClose} onAdded={onAdded} />);
    expect(screen.getByRole('dialog', { name: 'Classic Burger' })).toBeTruthy();
  });
});
