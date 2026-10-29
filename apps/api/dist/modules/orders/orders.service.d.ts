import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { Order, OrderDocument } from './order.schema';
import { OrderCounterDocument } from './order-counter.schema';
import { OrderStatus, Role } from '@fastfood/shared-types';
import { MenuService } from '../menu/menu.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { UsersService } from '../users/users.service';
import { RidersService } from '../riders/riders.module';
export declare class OrdersService {
    private orderModel;
    private counterModel;
    private menuService;
    private notifications;
    private gateway;
    private usersService;
    private ridersService;
    private dispatchQueue;
    constructor(orderModel: Model<OrderDocument>, counterModel: Model<OrderCounterDocument>, menuService: MenuService, notifications: NotificationsService, gateway: RealtimeGateway, usersService: UsersService, ridersService: RidersService, dispatchQueue: Queue | null);
    private getNextOrderNumber;
    create(customerId: string, body: {
        items: {
            menuItemId: string;
            quantity: number;
            sizeLabel?: string;
            addOns?: string[];
        }[];
        deliveryAddress: {
            lat: number;
            lng: number;
            addressLine: string;
            landmark?: string;
        };
        payment: {
            method: string;
        };
        notes?: string;
        idempotencyKey?: string;
    }): Promise<(import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | (import("mongoose").FlattenMaps<OrderDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })>;
    listForCustomer(customerId: string, page?: number, limit?: number): Promise<(import("mongoose").FlattenMaps<OrderDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getById(orderId: string, userId: string, role: Role): Promise<import("mongoose").FlattenMaps<OrderDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    listAll(status?: OrderStatus, page?: number, limit?: number): Promise<(import("mongoose").FlattenMaps<OrderDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    transition(orderId: string, toStatus: OrderStatus, actorId: string, role: Role, note?: string): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    riderAccept(orderId: string, riderId: string): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    verifyOtpAndDeliver(orderId: string, riderId: string, otp: string, cashCollectedPaisa: number): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    cancel(orderId: string, customerId: string, reason: string): Promise<import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getOtpForCustomer(orderId: string, customerId: string): Promise<string>;
    getAvailableOrders(): Promise<(import("mongoose").FlattenMaps<OrderDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getRiderActiveOrder(riderId: string): Promise<(import("mongoose").FlattenMaps<OrderDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    getAnalytics(days?: number): Promise<{
        revenueData: any[];
        statusData: any[];
    }>;
    private handlePostTransition;
}
//# sourceMappingURL=orders.service.d.ts.map