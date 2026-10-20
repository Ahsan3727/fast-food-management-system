import { z } from 'zod';
import { OrderStatus, PaymentMethod, Role } from './enums';

// ──────────────────────────────────────────
// Auth
// ──────────────────────────────────────────

export const LoginSchema = z.object({
  phone: z.string().min(10).max(15).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6),
}).refine((d: { phone?: string; email?: string }) => d.phone ?? d.email, {
  message: 'Either phone or email is required',
});

export const RegisterSchema = z.object({
  name: z.string().min(2).max(60),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  password: z.string().min(8),
});

export const OtpRequestSchema = z.object({
  phone: z.string().min(10).max(15),
});

export const OtpVerifySchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
});

// ──────────────────────────────────────────
// Menu
// ──────────────────────────────────────────

export const MenuItemSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  categoryId: z.string(),
  basePrice: z.number().int(), // paisa
  image: z.string().url().optional(),
  emoji: z.string().optional(),
  isAvailable: z.boolean(),
  sizes: z
    .array(
      z.object({
        label: z.string(),
        price: z.number().int(), // paisa
      }),
    )
    .optional(),
  addOns: z
    .array(
      z.object({
        label: z.string(),
        price: z.number().int(), // paisa
      }),
    )
    .optional(),
});

export const CategorySchema = z.object({
  _id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  image: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
});

// ──────────────────────────────────────────
// Orders
// ──────────────────────────────────────────

export const CartItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().min(1).max(50),
  sizeLabel: z.string().optional(),
  addOns: z.array(z.string()).optional(),
  notes: z.string().max(200).optional(),
});

export const DeliveryAddressSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  addressLine: z.string().min(5).max(300),
  landmark: z.string().max(100).optional(),
});

export const CreateOrderSchema = z.object({
  items: z.array(CartItemSchema).min(1),
  deliveryAddress: DeliveryAddressSchema,
  payment: z.object({ method: z.nativeEnum(PaymentMethod) }),
  notes: z.string().max(500).optional(),
});

export const OrderSummarySchema = z.object({
  _id: z.string(),
  orderNumber: z.string(),
  status: z.nativeEnum(OrderStatus),
  totalPaisa: z.number().int(),
  createdAt: z.string(),
  itemCount: z.number().int(),
});

// ──────────────────────────────────────────
// Rider
// ──────────────────────────────────────────

export const RiderLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  orderId: z.string(),
});

export const DeliveryRequestSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  restaurantAddress: z.string(),
  restaurantLat: z.number(),
  restaurantLng: z.number(),
  dropArea: z.string(), // rough area only — exact address after accept
  estimatedEarningPaisa: z.number().int(),
  expiresAt: z.string(), // ISO timestamp
});

// ──────────────────────────────────────────
// Re-export all types as TypeScript types
// ──────────────────────────────────────────

export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type OtpRequestDto = z.infer<typeof OtpRequestSchema>;
export type OtpVerifyDto = z.infer<typeof OtpVerifySchema>;
export type MenuItemDto = z.infer<typeof MenuItemSchema>;
export type CategoryDto = z.infer<typeof CategorySchema>;
export type CartItemDto = z.infer<typeof CartItemSchema>;
export type DeliveryAddressDto = z.infer<typeof DeliveryAddressSchema>;
export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type OrderSummaryDto = z.infer<typeof OrderSummarySchema>;
export type RiderLocationDto = z.infer<typeof RiderLocationSchema>;
export type DeliveryRequestDto = z.infer<typeof DeliveryRequestSchema>;
export type RoleType = `${Role}`;
