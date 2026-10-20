import { z } from 'zod';
import { OrderStatus, PaymentMethod, Role } from './enums';
export declare const LoginSchema: z.ZodEffects<z.ZodObject<{
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    phone?: string | undefined;
    email?: string | undefined;
}, {
    password: string;
    phone?: string | undefined;
    email?: string | undefined;
}>, {
    password: string;
    phone?: string | undefined;
    email?: string | undefined;
}, {
    password: string;
    phone?: string | undefined;
    email?: string | undefined;
}>;
export declare const RegisterSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    password: string;
    name: string;
    email?: string | undefined;
}, {
    phone: string;
    password: string;
    name: string;
    email?: string | undefined;
}>;
export declare const OtpRequestSchema: z.ZodObject<{
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
}, {
    phone: string;
}>;
export declare const OtpVerifySchema: z.ZodObject<{
    phone: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    otp: string;
}, {
    phone: string;
    otp: string;
}>;
export declare const MenuItemSchema: z.ZodObject<{
    _id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodString;
    basePrice: z.ZodNumber;
    image: z.ZodOptional<z.ZodString>;
    emoji: z.ZodOptional<z.ZodString>;
    isAvailable: z.ZodBoolean;
    sizes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        label: string;
        price: number;
    }, {
        label: string;
        price: number;
    }>, "many">>;
    addOns: z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        label: string;
        price: number;
    }, {
        label: string;
        price: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    _id: string;
    categoryId: string;
    basePrice: number;
    isAvailable: boolean;
    description?: string | undefined;
    image?: string | undefined;
    emoji?: string | undefined;
    sizes?: {
        label: string;
        price: number;
    }[] | undefined;
    addOns?: {
        label: string;
        price: number;
    }[] | undefined;
}, {
    name: string;
    _id: string;
    categoryId: string;
    basePrice: number;
    isAvailable: boolean;
    description?: string | undefined;
    image?: string | undefined;
    emoji?: string | undefined;
    sizes?: {
        label: string;
        price: number;
    }[] | undefined;
    addOns?: {
        label: string;
        price: number;
    }[] | undefined;
}>;
export declare const CategorySchema: z.ZodObject<{
    _id: z.ZodString;
    name: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    _id: string;
    image?: string | undefined;
    icon?: string | undefined;
    sortOrder?: number | undefined;
}, {
    name: string;
    _id: string;
    image?: string | undefined;
    icon?: string | undefined;
    sortOrder?: number | undefined;
}>;
export declare const CartItemSchema: z.ZodObject<{
    menuItemId: z.ZodString;
    quantity: z.ZodNumber;
    sizeLabel: z.ZodOptional<z.ZodString>;
    addOns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    menuItemId: string;
    quantity: number;
    addOns?: string[] | undefined;
    sizeLabel?: string | undefined;
    notes?: string | undefined;
}, {
    menuItemId: string;
    quantity: number;
    addOns?: string[] | undefined;
    sizeLabel?: string | undefined;
    notes?: string | undefined;
}>;
export declare const DeliveryAddressSchema: z.ZodObject<{
    lat: z.ZodNumber;
    lng: z.ZodNumber;
    addressLine: z.ZodString;
    landmark: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
    addressLine: string;
    landmark?: string | undefined;
}, {
    lat: number;
    lng: number;
    addressLine: string;
    landmark?: string | undefined;
}>;
export declare const CreateOrderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        menuItemId: z.ZodString;
        quantity: z.ZodNumber;
        sizeLabel: z.ZodOptional<z.ZodString>;
        addOns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        menuItemId: string;
        quantity: number;
        addOns?: string[] | undefined;
        sizeLabel?: string | undefined;
        notes?: string | undefined;
    }, {
        menuItemId: string;
        quantity: number;
        addOns?: string[] | undefined;
        sizeLabel?: string | undefined;
        notes?: string | undefined;
    }>, "many">;
    deliveryAddress: z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
        addressLine: z.ZodString;
        landmark: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
        addressLine: string;
        landmark?: string | undefined;
    }, {
        lat: number;
        lng: number;
        addressLine: string;
        landmark?: string | undefined;
    }>;
    payment: z.ZodObject<{
        method: z.ZodNativeEnum<typeof PaymentMethod>;
    }, "strip", z.ZodTypeAny, {
        method: PaymentMethod;
    }, {
        method: PaymentMethod;
    }>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        menuItemId: string;
        quantity: number;
        addOns?: string[] | undefined;
        sizeLabel?: string | undefined;
        notes?: string | undefined;
    }[];
    deliveryAddress: {
        lat: number;
        lng: number;
        addressLine: string;
        landmark?: string | undefined;
    };
    payment: {
        method: PaymentMethod;
    };
    notes?: string | undefined;
}, {
    items: {
        menuItemId: string;
        quantity: number;
        addOns?: string[] | undefined;
        sizeLabel?: string | undefined;
        notes?: string | undefined;
    }[];
    deliveryAddress: {
        lat: number;
        lng: number;
        addressLine: string;
        landmark?: string | undefined;
    };
    payment: {
        method: PaymentMethod;
    };
    notes?: string | undefined;
}>;
export declare const OrderSummarySchema: z.ZodObject<{
    _id: z.ZodString;
    orderNumber: z.ZodString;
    status: z.ZodNativeEnum<typeof OrderStatus>;
    totalPaisa: z.ZodNumber;
    createdAt: z.ZodString;
    itemCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: OrderStatus;
    _id: string;
    orderNumber: string;
    totalPaisa: number;
    createdAt: string;
    itemCount: number;
}, {
    status: OrderStatus;
    _id: string;
    orderNumber: string;
    totalPaisa: number;
    createdAt: string;
    itemCount: number;
}>;
export declare const RiderLocationSchema: z.ZodObject<{
    lat: z.ZodNumber;
    lng: z.ZodNumber;
    orderId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
    orderId: string;
}, {
    lat: number;
    lng: number;
    orderId: string;
}>;
export declare const DeliveryRequestSchema: z.ZodObject<{
    orderId: z.ZodString;
    orderNumber: z.ZodString;
    restaurantAddress: z.ZodString;
    restaurantLat: z.ZodNumber;
    restaurantLng: z.ZodNumber;
    dropArea: z.ZodString;
    estimatedEarningPaisa: z.ZodNumber;
    expiresAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    orderNumber: string;
    orderId: string;
    restaurantAddress: string;
    restaurantLat: number;
    restaurantLng: number;
    dropArea: string;
    estimatedEarningPaisa: number;
    expiresAt: string;
}, {
    orderNumber: string;
    orderId: string;
    restaurantAddress: string;
    restaurantLat: number;
    restaurantLng: number;
    dropArea: string;
    estimatedEarningPaisa: number;
    expiresAt: string;
}>;
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
//# sourceMappingURL=schemas.d.ts.map