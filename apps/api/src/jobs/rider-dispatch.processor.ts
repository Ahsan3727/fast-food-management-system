import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../modules/orders/order.schema';
import { OrderStatus } from '@fastfood/shared-types';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../modules/notifications/notifications.service';

export const RIDER_DISPATCH_QUEUE = 'rider-dispatch';
export const JOB_DISPATCH_OFFER = 'dispatch-offer';

export interface DispatchOfferPayload {
  orderId: string;
  orderNumber: string;
  riderFcmTokens: Record<string, string>; // riderId → fcmToken
}

@Processor(RIDER_DISPATCH_QUEUE)
export class RiderDispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(RiderDispatchProcessor.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly gateway: RealtimeGateway,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<DispatchOfferPayload>): Promise<void> {
    if (job.name !== JOB_DISPATCH_OFFER) return;

    const { orderId, orderNumber, riderFcmTokens } = job.data;

    // Check if order was already accepted before timeout fired
    const order = await this.orderModel.findById(orderId).lean();
    if (!order) return;

    if (order.status !== OrderStatus.READY) {
      this.logger.log(`Order ${orderNumber} already handled (${order.status}) — no reassign needed`);
      return;
    }

    // Nobody accepted within 60s — alert admin via socket
    this.logger.warn(`⚠️ Order ${orderNumber} has no rider after 60s — alerting admin`);
    this.gateway.server?.to('restaurant:main').emit('order:no-rider', {
      orderId,
      orderNumber,
      message: `No rider accepted order #${orderNumber} within 60 seconds`,
    });

    // Send push to all available rider tokens again (wider search)
    const tokens = Object.values(riderFcmTokens);
    await this.notifications.sendToTokens(
      tokens,
      '🚨 Urgent — Delivery Needed',
      `Order #${orderNumber} still needs a rider — please accept!`,
      { type: 'DELIVERY_REQUEST_URGENT', orderId },
    );
  }
}
