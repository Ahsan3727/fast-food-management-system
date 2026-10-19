// ============================================================
// ENUMS — single source of truth for all status values, roles
// and payment types. Import from here everywhere.
// ============================================================

export enum Role {
  CUSTOMER = 'customer',
  RIDER = 'rider',
  STAFF = 'staff',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PLACED = 'PLACED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  RIDER_ASSIGNED = 'RIDER_ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
}

export enum PaymentMethod {
  COD = 'cod',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COLLECTED = 'collected',
  SETTLED = 'settled',
}

export enum Platform {
  ANDROID = 'android',
  WEB = 'web',
}

// ============================================================
// SOCKET EVENT NAMES
// All socket event names live here — apps and the API both
// import from this package so event strings never drift apart.
// ============================================================

export const SocketEvents = {
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
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
