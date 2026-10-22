/**
 * Safely extracts arrays from API responses that might be structured as:
 * - { items: T[] }
 * - { orders: T[] }
 * - { data: T[] }
 * - { users: T[] }
 * - T[]
 */
export function unwrapList<T = any>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload.data && Array.isArray(payload.data)) return payload.data;
  if (payload.items && Array.isArray(payload.items)) return payload.items;
  if (payload.orders && Array.isArray(payload.orders)) return payload.orders;
  if (payload.users && Array.isArray(payload.users)) return payload.users;
  if (payload.categories && Array.isArray(payload.categories)) return payload.categories;
  return [];
}
