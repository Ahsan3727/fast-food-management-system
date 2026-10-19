import { OrderStatus, Role } from '@fastfood/shared-types';

/**
 * Order state machine.
 * Key: current status → Value: allowed next statuses and who can trigger them.
 * The server is the ONLY authority on status changes.
 */

type AllowedTransition = { to: OrderStatus; roles: Role[] };

export const ORDER_TRANSITIONS: Partial<Record<OrderStatus, AllowedTransition[]>> = {
  [OrderStatus.PLACED]: [
    { to: OrderStatus.ACCEPTED, roles: [Role.ADMIN, Role.STAFF] },
    { to: OrderStatus.REJECTED, roles: [Role.ADMIN, Role.STAFF] },
    { to: OrderStatus.CANCELLED, roles: [Role.CUSTOMER, Role.ADMIN] },
  ],
  [OrderStatus.ACCEPTED]: [
    { to: OrderStatus.PREPARING, roles: [Role.ADMIN, Role.STAFF] },
    { to: OrderStatus.CANCELLED, roles: [Role.ADMIN] },
  ],
  [OrderStatus.PREPARING]: [
    { to: OrderStatus.READY, roles: [Role.ADMIN, Role.STAFF] },
    { to: OrderStatus.CANCELLED, roles: [Role.ADMIN] },
  ],
  [OrderStatus.READY]: [
    { to: OrderStatus.RIDER_ASSIGNED, roles: [Role.RIDER, Role.ADMIN] },
  ],
  [OrderStatus.RIDER_ASSIGNED]: [
    { to: OrderStatus.PICKED_UP, roles: [Role.RIDER] },
  ],
  [OrderStatus.PICKED_UP]: [
    { to: OrderStatus.DELIVERED, roles: [Role.RIDER] },
    { to: OrderStatus.DELIVERY_FAILED, roles: [Role.RIDER] },
  ],
};

export function canTransition(from: OrderStatus, to: OrderStatus, role: Role): boolean {
  const allowed = ORDER_TRANSITIONS[from] ?? [];
  return allowed.some((t) => t.to === to && t.roles.includes(role));
}
