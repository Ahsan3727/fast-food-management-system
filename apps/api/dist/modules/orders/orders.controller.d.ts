import { OrdersService } from './orders.service';
import { OrderStatus } from '@fastfood/shared-types';
declare class CreateOrderDto {
    items: any[];
    deliveryAddress: any;
    payment: any;
    notes?: string;
}
declare class TransitionDto {
    status: OrderStatus;
    note?: string;
}
declare class DeliverDto {
    otp: string;
    cashCollectedPaisa: number;
}
declare class CancelDto {
    reason: string;
}
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(req: any, dto: CreateOrderDto, idempotencyKey?: string): Promise<(import("mongoose").Document<unknown, {}, import("./order.schema").OrderDocument, {}, {}> & import("./order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | (import("mongoose").FlattenMaps<import("./order.schema").OrderDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })>;
    listMyOrders(req: any, page?: number, limit?: number): Promise<(import("mongoose").FlattenMaps<import("./order.schema").OrderDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getOtp(req: any, id: string): Promise<string>;
    cancelOrder(req: any, id: string, dto: CancelDto): Promise<import("mongoose").Document<unknown, {}, import("./order.schema").OrderDocument, {}, {}> & import("./order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getAvailable(): Promise<(import("mongoose").FlattenMaps<import("./order.schema").OrderDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    acceptOrder(req: any, id: string): Promise<import("mongoose").Document<unknown, {}, import("./order.schema").OrderDocument, {}, {}> & import("./order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getActiveOrder(req: any): Promise<(import("mongoose").FlattenMaps<import("./order.schema").OrderDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    deliver(req: any, id: string, dto: DeliverDto): Promise<import("mongoose").Document<unknown, {}, import("./order.schema").OrderDocument, {}, {}> & import("./order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    listAll(status?: OrderStatus, page?: number, limit?: number): Promise<(import("mongoose").FlattenMaps<import("./order.schema").OrderDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    transition(req: any, id: string, dto: TransitionDto): Promise<import("mongoose").Document<unknown, {}, import("./order.schema").OrderDocument, {}, {}> & import("./order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getAnalytics(days?: number): Promise<{
        revenueData: any[];
        statusData: any[];
    }>;
    getById(req: any, id: string): Promise<import("mongoose").FlattenMaps<import("./order.schema").OrderDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
export {};
//# sourceMappingURL=orders.controller.d.ts.map