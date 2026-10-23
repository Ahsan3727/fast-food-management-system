/**
 * Unified query key factory for FastFood CustomerApp (WP4)
 * Import QK from here instead of writing inline arrays.
 */
export const QK = {
  categories:  ['categories'] as const,
  menu:        (catId?: string) => ['menu', catId ?? ''] as const,
  menuItem:    (id: string)    => ['menu-item', id] as const,
  myOrders:    ['my-orders'] as const,
  order:       (id: string)    => ['order', id] as const,
  orderOtp:    (id: string)    => ['order-otp', id] as const,
  profile:     ['profile'] as const,
  search:      (q: string)     => ['menu', 'search', q] as const,
} as const;
