import { OrderStatus, Role } from '@fastfood/shared-types';
/**
 * Order state machine.
 * Key: current status → Value: allowed next statuses and who can trigger them.
 * The server is the ONLY authority on status changes.
 */
type AllowedTransition = {
    to: OrderStatus;
    roles: Role[];
};
export declare const ORDER_TRANSITIONS: Partial<Record<OrderStatus, AllowedTransition[]>>;
export declare function canTransition(from: OrderStatus, to: OrderStatus, role: Role): boolean;
export {};
//# sourceMappingURL=order.state-machine.d.ts.map