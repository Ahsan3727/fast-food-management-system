"use strict";
// ============================================================
// ENUMS — single source of truth for all status values, roles
// and payment types. Import from here everywhere.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_TILES = exports.STATUS_META = exports.SocketEvents = exports.Platform = exports.PaymentStatus = exports.PaymentMethod = exports.OrderStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["CUSTOMER"] = "customer";
    Role["RIDER"] = "rider";
    Role["STAFF"] = "staff";
    Role["ADMIN"] = "admin";
})(Role || (exports.Role = Role = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PLACED"] = "PLACED";
    OrderStatus["ACCEPTED"] = "ACCEPTED";
    OrderStatus["REJECTED"] = "REJECTED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["PREPARING"] = "PREPARING";
    OrderStatus["READY"] = "READY";
    OrderStatus["RIDER_ASSIGNED"] = "RIDER_ASSIGNED";
    OrderStatus["PICKED_UP"] = "PICKED_UP";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["DELIVERY_FAILED"] = "DELIVERY_FAILED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["COD"] = "cod";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COLLECTED"] = "collected";
    PaymentStatus["SETTLED"] = "settled";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var Platform;
(function (Platform) {
    Platform["ANDROID"] = "android";
    Platform["WEB"] = "web";
})(Platform || (exports.Platform = Platform = {}));
// ============================================================
// SOCKET EVENT NAMES
// All socket event names live here — apps and the API both
// import from this package so event strings never drift apart.
// ============================================================
exports.SocketEvents = {
    // Server → Admin panel room
    ORDER_NEW: 'order:new',
    // Server → Customer order room
    ORDER_STATUS: 'order:status',
    // Server → riders:available room
    DELIVERY_REQUEST: 'delivery:request',
    DELIVERY_REQUEST_CANCELLED: 'delivery:request:cancelled',
    // Rider → Server (client emits)
    RIDER_LOCATION_EMIT: 'rider:location',
    // Server → Customer order room (forwarded rider location)
    RIDER_LOCATION_UPDATE: 'rider:location:update',
    // System events
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',
};
exports.STATUS_META = {
    [OrderStatus.PLACED]: {
        label: 'Order Placed',
        tone: 'blue',
        icon: 'clipboard',
        step: 1,
        isActive: true,
        customerDescription: 'Waiting for the restaurant to accept your order.',
        riderDescription: 'Order placed by customer.',
    },
    [OrderStatus.ACCEPTED]: {
        label: 'Accepted',
        tone: 'indigo',
        icon: 'check',
        step: 2,
        isActive: true,
        customerDescription: 'The restaurant is getting started.',
        riderDescription: 'Restaurant accepted order.',
    },
    [OrderStatus.PREPARING]: {
        label: 'Preparing',
        tone: 'amber',
        icon: 'chef',
        step: 3,
        isActive: true,
        customerDescription: 'Your food is being cooked.',
        riderDescription: 'Kitchen is preparing food.',
    },
    [OrderStatus.READY]: {
        label: 'Ready · Finding Rider',
        tone: 'teal',
        icon: 'package',
        step: 3,
        isActive: true,
        customerDescription: 'Your order is packed. We are finding a rider.',
        riderDescription: 'Ready for pickup. Accept now.',
    },
    [OrderStatus.RIDER_ASSIGNED]: {
        label: 'Rider on the Way',
        tone: 'purple',
        icon: 'bike',
        step: 4,
        isActive: true,
        customerDescription: 'Your rider is heading to the restaurant.',
        riderDescription: 'Heading to restaurant for pickup.',
    },
    [OrderStatus.PICKED_UP]: {
        label: 'On the Way to You',
        tone: 'orange',
        icon: 'nav',
        step: 4,
        isActive: true,
        customerDescription: 'Your rider is on the way. Keep your delivery code ready.',
        riderDescription: 'Delivering to customer. Collect cash & verify OTP.',
    },
    [OrderStatus.DELIVERED]: {
        label: 'Delivered',
        tone: 'green',
        icon: 'check',
        step: 5,
        isActive: false,
        customerDescription: 'Enjoy your meal.',
        riderDescription: 'Order successfully delivered.',
    },
    [OrderStatus.CANCELLED]: {
        label: 'Cancelled',
        tone: 'stone',
        icon: 'ban',
        step: 0,
        isActive: false,
        customerDescription: 'Order was cancelled.',
        riderDescription: 'Order cancelled.',
    },
    [OrderStatus.REJECTED]: {
        label: 'Rejected',
        tone: 'red',
        icon: 'ban',
        step: 0,
        isActive: false,
        customerDescription: 'Restaurant could not accept order.',
        riderDescription: 'Order rejected.',
    },
    [OrderStatus.DELIVERY_FAILED]: {
        label: 'Delivery Failed',
        tone: 'rose',
        icon: 'ban',
        step: 0,
        isActive: false,
        customerDescription: 'Delivery could not be completed.',
        riderDescription: 'Delivery marked as failed.',
    },
};
exports.CATEGORY_TILES = [
    '#FED7AA', // orange
    '#FDE68A', // amber
    '#FCE7F3', // pink
    '#D9F99D', // lime
    '#BAE6FD', // sky
    '#FECDD3', // rose
    '#DDD6FE', // violet
    '#99F6E4', // teal
];
//# sourceMappingURL=enums.js.map