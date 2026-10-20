export declare enum Role {
    CUSTOMER = "customer",
    RIDER = "rider",
    STAFF = "staff",
    ADMIN = "admin"
}
export declare enum OrderStatus {
    PLACED = "PLACED",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
    PREPARING = "PREPARING",
    READY = "READY",
    RIDER_ASSIGNED = "RIDER_ASSIGNED",
    PICKED_UP = "PICKED_UP",
    DELIVERED = "DELIVERED",
    DELIVERY_FAILED = "DELIVERY_FAILED"
}
export declare enum PaymentMethod {
    COD = "cod"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    COLLECTED = "collected",
    SETTLED = "settled"
}
export declare enum Platform {
    ANDROID = "android",
    WEB = "web"
}
export declare const SocketEvents: {
    readonly ORDER_NEW: "order:new";
    readonly ORDER_STATUS: "order:status";
    readonly DELIVERY_REQUEST: "delivery:request";
    readonly DELIVERY_REQUEST_CANCELLED: "delivery:request:cancelled";
    readonly RIDER_LOCATION_EMIT: "rider:location";
    readonly RIDER_LOCATION_UPDATE: "rider:location:update";
    readonly CONNECT: "connect";
    readonly DISCONNECT: "disconnect";
    readonly CONNECT_ERROR: "connect_error";
};
export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
//# sourceMappingURL=enums.d.ts.map