"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDER_TRANSITIONS = void 0;
exports.canTransition = canTransition;
const shared_types_1 = require("@fastfood/shared-types");
exports.ORDER_TRANSITIONS = {
    [shared_types_1.OrderStatus.PLACED]: [
        { to: shared_types_1.OrderStatus.ACCEPTED, roles: [shared_types_1.Role.ADMIN, shared_types_1.Role.STAFF] },
        { to: shared_types_1.OrderStatus.REJECTED, roles: [shared_types_1.Role.ADMIN, shared_types_1.Role.STAFF] },
        { to: shared_types_1.OrderStatus.CANCELLED, roles: [shared_types_1.Role.CUSTOMER, shared_types_1.Role.ADMIN] },
    ],
    [shared_types_1.OrderStatus.ACCEPTED]: [
        { to: shared_types_1.OrderStatus.PREPARING, roles: [shared_types_1.Role.ADMIN, shared_types_1.Role.STAFF] },
        { to: shared_types_1.OrderStatus.CANCELLED, roles: [shared_types_1.Role.ADMIN] },
    ],
    [shared_types_1.OrderStatus.PREPARING]: [
        { to: shared_types_1.OrderStatus.READY, roles: [shared_types_1.Role.ADMIN, shared_types_1.Role.STAFF] },
        { to: shared_types_1.OrderStatus.CANCELLED, roles: [shared_types_1.Role.ADMIN] },
    ],
    [shared_types_1.OrderStatus.READY]: [
        { to: shared_types_1.OrderStatus.RIDER_ASSIGNED, roles: [shared_types_1.Role.RIDER, shared_types_1.Role.ADMIN] },
    ],
    [shared_types_1.OrderStatus.RIDER_ASSIGNED]: [
        { to: shared_types_1.OrderStatus.PICKED_UP, roles: [shared_types_1.Role.RIDER] },
    ],
    [shared_types_1.OrderStatus.PICKED_UP]: [
        { to: shared_types_1.OrderStatus.DELIVERED, roles: [shared_types_1.Role.RIDER] },
        { to: shared_types_1.OrderStatus.DELIVERY_FAILED, roles: [shared_types_1.Role.RIDER] },
    ],
};
function canTransition(from, to, role) {
    const allowed = exports.ORDER_TRANSITIONS[from] ?? [];
    return allowed.some((t) => t.to === to && t.roles.includes(role));
}
//# sourceMappingURL=order.state-machine.js.map