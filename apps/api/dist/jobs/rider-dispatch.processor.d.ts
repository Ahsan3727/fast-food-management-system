import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { OrderDocument } from '../modules/orders/order.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../modules/notifications/notifications.service';
export declare const RIDER_DISPATCH_QUEUE = "rider-dispatch";
export declare const JOB_DISPATCH_OFFER = "dispatch-offer";
export interface DispatchOfferPayload {
    orderId: string;
    orderNumber: string;
    riderFcmTokens: Record<string, string>;
}
export declare class RiderDispatchProcessor extends WorkerHost {
    private readonly orderModel;
    private readonly gateway;
    private readonly notifications;
    private readonly logger;
    constructor(orderModel: Model<OrderDocument>, gateway: RealtimeGateway, notifications: NotificationsService);
    process(job: Job<DispatchOfferPayload>): Promise<void>;
}
//# sourceMappingURL=rider-dispatch.processor.d.ts.map