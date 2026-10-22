/**
 * Unified queryKeys factory for FastFood Admin (WP4, spec §8.2)
 * Ensures no cache collisions between different views and filter sets.
 */
export const queryKeys = {
  orders: {
    all: ['orders'] as const,
    list: (filters: Record<string, any> = {}) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    placedCount: ['orders-placed-count'] as const,
  },
  stats: {
    overview: (range: string = 'today') => ['stats', range] as const,
  },
  riders: {
    all: ['riders'] as const,
    detail: (id: string) => ['riders', 'detail', id] as const,
  },
  customers: {
    all: (q: string = '') => ['customers', 'list', { q }] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
    orders: (customerId: string) => ['customers', 'orders', customerId] as const,
  },
  menu: {
    items: ['menu', 'items'] as const,
    categories: ['menu', 'categories'] as const,
  },
};
