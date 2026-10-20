"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryRequestSchema = exports.RiderLocationSchema = exports.OrderSummarySchema = exports.CreateOrderSchema = exports.DeliveryAddressSchema = exports.CartItemSchema = exports.CategorySchema = exports.MenuItemSchema = exports.OtpVerifySchema = exports.OtpRequestSchema = exports.RegisterSchema = exports.LoginSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
// ──────────────────────────────────────────
// Auth
// ──────────────────────────────────────────
exports.LoginSchema = zod_1.z.object({
    phone: zod_1.z.string().min(10).max(15).optional(),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(6),
}).refine((d) => d.phone ?? d.email, {
    message: 'Either phone or email is required',
});
exports.RegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(60),
    phone: zod_1.z.string().min(10).max(15),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(8),
});
exports.OtpRequestSchema = zod_1.z.object({
    phone: zod_1.z.string().min(10).max(15),
});
exports.OtpVerifySchema = zod_1.z.object({
    phone: zod_1.z.string().min(10).max(15),
    otp: zod_1.z.string().length(6),
});
// ──────────────────────────────────────────
// Menu
// ──────────────────────────────────────────
exports.MenuItemSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    categoryId: zod_1.z.string(),
    basePrice: zod_1.z.number().int(), // paisa
    image: zod_1.z.string().url().optional(),
    emoji: zod_1.z.string().optional(),
    isAvailable: zod_1.z.boolean(),
    sizes: zod_1.z
        .array(zod_1.z.object({
        label: zod_1.z.string(),
        price: zod_1.z.number().int(), // paisa
    }))
        .optional(),
    addOns: zod_1.z
        .array(zod_1.z.object({
        label: zod_1.z.string(),
        price: zod_1.z.number().int(), // paisa
    }))
        .optional(),
});
exports.CategorySchema = zod_1.z.object({
    _id: zod_1.z.string(),
    name: zod_1.z.string(),
    icon: zod_1.z.string().optional(),
    image: zod_1.z.string().url().optional(),
    sortOrder: zod_1.z.number().int().optional(),
});
// ──────────────────────────────────────────
// Orders
// ──────────────────────────────────────────
exports.CartItemSchema = zod_1.z.object({
    menuItemId: zod_1.z.string(),
    quantity: zod_1.z.number().int().min(1).max(50),
    sizeLabel: zod_1.z.string().optional(),
    addOns: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().max(200).optional(),
});
exports.DeliveryAddressSchema = zod_1.z.object({
    lat: zod_1.z.number(),
    lng: zod_1.z.number(),
    addressLine: zod_1.z.string().min(5).max(300),
    landmark: zod_1.z.string().max(100).optional(),
});
exports.CreateOrderSchema = zod_1.z.object({
    items: zod_1.z.array(exports.CartItemSchema).min(1),
    deliveryAddress: exports.DeliveryAddressSchema,
    payment: zod_1.z.object({ method: zod_1.z.nativeEnum(enums_1.PaymentMethod) }),
    notes: zod_1.z.string().max(500).optional(),
});
exports.OrderSummarySchema = zod_1.z.object({
    _id: zod_1.z.string(),
    orderNumber: zod_1.z.string(),
    status: zod_1.z.nativeEnum(enums_1.OrderStatus),
    totalPaisa: zod_1.z.number().int(),
    createdAt: zod_1.z.string(),
    itemCount: zod_1.z.number().int(),
});
// ──────────────────────────────────────────
// Rider
// ──────────────────────────────────────────
exports.RiderLocationSchema = zod_1.z.object({
    lat: zod_1.z.number(),
    lng: zod_1.z.number(),
    orderId: zod_1.z.string(),
});
exports.DeliveryRequestSchema = zod_1.z.object({
    orderId: zod_1.z.string(),
    orderNumber: zod_1.z.string(),
    restaurantAddress: zod_1.z.string(),
    restaurantLat: zod_1.z.number(),
    restaurantLng: zod_1.z.number(),
    dropArea: zod_1.z.string(), // rough area only — exact address after accept
    estimatedEarningPaisa: zod_1.z.number().int(),
    expiresAt: zod_1.z.string(), // ISO timestamp
});
//# sourceMappingURL=schemas.js.map