import { Document } from 'mongoose';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@fastfood/shared-types';
export type OrderDocument = Order & Document;
export declare class Order {
    orderNumber: string;
    customerId: string;
    riderId?: string;
    status: OrderStatus;
    items: {
        menuItemId: string;
        name: string;
        image?: string;
        sizeLabel?: string;
        addOns: string[];
        unitPricePaisa: number;
        quantity: number;
        lineTotalPaisa: number;
    }[];
    totalPaisa: number;
    deliveryAddress: {
        lat: number;
        lng: number;
        addressLine: string;
        landmark?: string;
    };
    payment: {
        method: PaymentMethod;
        status: PaymentStatus;
        amountCollectedPaisa?: number;
    };
    notes?: string;
    rejectionReason?: string;
    cancellationReason?: string;
    deliveryOtp?: string;
    idempotencyKey?: string;
    statusHistory: {
        status: string;
        by: string;
        at: Date;
        note?: string;
    }[];
}
export declare const OrderSchema: import("mongoose").Schema<Order, import("mongoose").Model<Order, any, any, any, Document<unknown, any, Order, any, {}> & Order & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Order, Document<unknown, {}, import("mongoose").FlatRecord<Order>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Order> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=order.schema.d.ts.map