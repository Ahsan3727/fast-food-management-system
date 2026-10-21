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

// ============================================================
// EMBER DESIGN SYSTEM: UNIFIED STATUS METADATA
// ============================================================

export interface StatusMeta {
  label: string;
  tone: 'blue' | 'indigo' | 'amber' | 'teal' | 'purple' | 'orange' | 'green' | 'stone' | 'red' | 'rose';
  icon: string;
  step: number;
  isActive: boolean;
  customerDescription: string;
  riderDescription: string;
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
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

export const CATEGORY_TILES = [
  '#FED7AA', // orange
  '#FDE68A', // amber
  '#FCE7F3', // pink
  '#D9F99D', // lime
  '#BAE6FD', // sky
  '#FECDD3', // rose
  '#DDD6FE', // violet
  '#99F6E4', // teal
] as const;
