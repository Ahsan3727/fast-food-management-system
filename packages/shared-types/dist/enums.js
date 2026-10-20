"use strict";
// ============================================================
// ENUMS — single source of truth for all status values, roles
// and payment types. Import from here everywhere.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvents = exports.Platform = exports.PaymentStatus = exports.PaymentMethod = exports.OrderStatus = exports.Role = void 0;
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
//# sourceMappingURL=enums.js.map