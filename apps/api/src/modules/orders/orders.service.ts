import {
  Injectable, BadRequestException, NotFoundException,
  ForbiddenException, ConflictException, Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomInt } from 'crypto';
import { Order, OrderDocument } from './order.schema';
import { OrderCounter, OrderCounterDocument } from './order-counter.schema';
import { OrderStatus, PaymentMethod, PaymentStatus, Role, SocketEvents } from '@fastfood/shared-types';
import { canTransition } from './order.state-machine';
import { MenuService } from '../menu/menu.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { UsersService } from '../users/users.service';
import { RidersService } from '../riders/riders.module';
import { RIDER_DISPATCH_QUEUE, JOB_DISPATCH_OFFER } from '../../jobs/rider-dispatch.processor';

function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderCounter.name) private counterModel: Model<OrderCounterDocument>,
    private menuService: MenuService,
    private notifications: NotificationsService,
    private gateway: RealtimeGateway,
    private usersService: UsersService,
    private ridersService: RidersService,
    @Optional() @InjectQueue(RIDER_DISPATCH_QUEUE) private dispatchQueue: Queue | null,
  ) {}

  private async getNextOrderNumber(): Promise<string> {
    const counter = await this.counterModel.findOneAndUpdate(
      { _id: 'order_number' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    // If first initialized (seq === 1), seed from highest existing order number
    if (counter.seq === 1) {
      let highest = 1000;
      try {
        const latest = await this.orderModel.findOne({}, { orderNumber: 1 }).sort({ createdAt: -1 }).lean();
        if (latest?.orderNumber) {
          const match = latest.orderNumber.match(/\d+$/);
          if (match) highest = Math.max(highest, parseInt(match[0], 10));
        }
      } catch {
        // Fallback to 1000 if empty
      }
      const seeded = await this.counterModel.findOneAndUpdate(
        { _id: 'order_number' },
        { $set: { seq: highest + 1 } },
        { new: true },
      );
      return `FD-${seeded?.seq ?? (highest + 1)}`;
    }

    return `FD-${counter.seq}`;
  }

  // ── Create Order ───────────────────────────────────────
  async create(customerId: string, body: {
    items: { menuItemId: string; quantity: number; sizeLabel?: string; addOns?: string[] }[];
    deliveryAddress: { lat: number; lng: number; addressLine: string; landmark?: string };
    payment: { method: string };
    notes?: string;
    idempotencyKey?: string;
  }) {
    // Idempotency — prevent duplicate orders
    if (body.idempotencyKey) {
      const dup = await this.orderModel.findOne({ idempotencyKey: body.idempotencyKey }).lean();
      if (dup) return dup;
    }

    // Validate delivery service area
    const restaurantLat = parseFloat(process.env.RESTAURANT_LAT ?? '31.5204');
    const restaurantLng = parseFloat(process.env.RESTAURANT_LNG ?? '74.3587');
    const maxRadiusKm = parseFloat(process.env.MAX_DELIVERY_RADIUS_KM ?? '25');

    const distanceKm = calculateHaversineDistanceKm(
      restaurantLat,
      restaurantLng,
      body.deliveryAddress.lat,
      body.deliveryAddress.lng,
    );
    if (distanceKm > maxRadiusKm) {
      throw new BadRequestException(
        `Delivery address is outside our delivery area (${Math.round(distanceKm)} km away, maximum is ${maxRadiusKm} km)`,
      );
    }

    // Server calculates price — never trusting the client
    const { itemSnapshots, totalPaisa: subtotalPaisa } = await this.menuService.validateCartAndPrice(body.items);

    // Calculate delivery fee on server
    const freeThreshold = parseInt(process.env.FREE_DELIVERY_OVER_PAISA ?? '100000', 10);
    const standardFee = parseInt(process.env.DELIVERY_FEE_PAISA ?? '10000', 10);
    const deliveryFeePaisa = subtotalPaisa >= freeThreshold ? 0 : standardFee;
    const totalPaisa = subtotalPaisa + deliveryFeePaisa;

    // Generate delivery OTP (6 digits)
    const otp = randomInt(100000, 1000000).toString();

    // Atomic order number
    const orderNumber = await this.getNextOrderNumber();

    const order = await new this.orderModel({
      orderNumber,
      customerId,
      status: OrderStatus.PLACED,
      items: itemSnapshots,
      subtotalPaisa,
      deliveryFeePaisa,
      totalPaisa,
      deliveryAddress: body.deliveryAddress,
      payment: { method: body.payment.method ?? PaymentMethod.COD, status: PaymentStatus.PENDING },
      notes: body.notes,
      idempotencyKey: body.idempotencyKey,
      deliveryOtp: otp,
      statusHistory: [{ status: OrderStatus.PLACED, by: customerId, at: new Date() }],
    }).save();

    // Notify restaurant via socket
    this.gateway.emitToRestaurant(SocketEvents.ORDER_NEW, {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      totalPaisa: order.totalPaisa,
      itemCount: order.items.length,
    });

    return order;
  }

  // ── Customer: list orders ──────────────────────────────
  async listForCustomer(customerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * Math.min(limit, 50);
    return this.orderModel
      .find({ customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(limit, 50))
      .lean();
  }

  // ── Get order by ID (with ownership check) ─────────────
  async getById(orderId: string, userId: string, role: Role) {
    const order = await this.orderModel.findById(orderId).lean();
    if (!order) throw new NotFoundException('Order not found');

    if (role === Role.CUSTOMER && order.customerId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (role === Role.RIDER && order.riderId?.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  // ── Admin: all orders ──────────────────────────────────
  async listAll(status?: OrderStatus, page = 1, limit = 50) {
    const filter: Record<string, unknown> = {};
    if (status) filter['status'] = status;
    const skip = (page - 1) * Math.min(limit, 100);
    return this.orderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.min(limit, 100)).lean();
  }

  // ── State transition (all actors) ─────────────────────
  async transition(orderId: string, toStatus: OrderStatus, actorId: string, role: Role, note?: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    if (role === Role.RIDER && order.riderId?.toString() !== actorId) {
      throw new ForbiddenException('Not assigned rider');
    }

    if (!canTransition(order.status, toStatus, role)) {
      throw new BadRequestException(
        `Cannot move from ${order.status} → ${toStatus} as ${role}`,
      );
    }

    order.status = toStatus;
    order.statusHistory.push({ status: toStatus, by: actorId, at: new Date(), note });
    const saved = await order.save();

    // ── Post-transition side-effects ──────────────────────
    await this.handlePostTransition(saved, actorId);

    return saved;
  }

  // ── Rider accept (ATOMIC — prevents race condition) ────
  async riderAccept(orderId: string, riderId: string) {
    const order = await this.orderModel.findOneAndUpdate(
      { _id: orderId, status: OrderStatus.READY, riderId: null },
      {
        $set: { status: OrderStatus.RIDER_ASSIGNED, riderId },
        $push: {
          statusHistory: { status: OrderStatus.RIDER_ASSIGNED, by: riderId, at: new Date() },
        },
      },
      { new: true },
    );

    if (!order) throw new ConflictException('Order already taken or not available');

    // Notify customer their rider is assigned
    const customer = await this.usersService.findById(order.customerId.toString());
    if (customer?.fcmToken) {
      await this.notifications.notifyCustomerOrderStatus(
        customer.fcmToken, order.orderNumber, OrderStatus.RIDER_ASSIGNED, order._id.toString(),
      );
    }
    this.gateway.emitToCustomer(order.customerId.toString(), SocketEvents.ORDER_STATUS, {
      orderId: order._id.toString(), status: OrderStatus.RIDER_ASSIGNED,
    });
    // Let rider join the order room
    this.gateway.emitToRestaurant(SocketEvents.ORDER_STATUS, {
      orderId: order._id.toString(), status: OrderStatus.RIDER_ASSIGNED, riderId,
    });

    return order;
  }

  // ── Delivery: verify OTP ───────────────────────────────
  async verifyOtpAndDeliver(orderId: string, riderId: string, otp: string, cashCollectedPaisa: number) {
    const order = await this.orderModel.findById(orderId).select('+deliveryOtp');
    if (!order) throw new NotFoundException('Order not found');
    if (order.riderId?.toString() !== riderId) throw new ForbiddenException('Not assigned rider');
    if (order.status !== OrderStatus.PICKED_UP) {
      throw new BadRequestException('Order must be PICKED_UP before delivery');
    }
    if (order.deliveryOtp !== otp) throw new BadRequestException('Invalid OTP');

    order.status = OrderStatus.DELIVERED;
    order.payment.amountCollectedPaisa = cashCollectedPaisa;
    order.payment.status = PaymentStatus.COLLECTED;
    order.statusHistory.push({ status: OrderStatus.DELIVERED, by: riderId, at: new Date() });
    const saved = await order.save();

    // If Cash On Delivery, record cash collected by rider in rider ledger
    if (saved.payment?.method === PaymentMethod.COD || !saved.payment?.method) {
      await this.ridersService.addUnsettledCash(riderId, saved.totalPaisa);
    }

    // Notify customer
    const customer = await this.usersService.findById(saved.customerId.toString());
    if (customer?.fcmToken) {
      await this.notifications.notifyCustomerOrderStatus(
        customer.fcmToken, saved.orderNumber, OrderStatus.DELIVERED, saved._id.toString(),
      );
    }
    this.gateway.emitToCustomer(saved.customerId.toString(), SocketEvents.ORDER_STATUS, {
      orderId: saved._id.toString(), status: OrderStatus.DELIVERED,
    });

    return saved;
  }

  // ── Customer: cancel ───────────────────────────────────
  async cancel(orderId: string, customerId: string, reason: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId.toString() !== customerId) throw new ForbiddenException('Access denied');

    if (!canTransition(order.status, OrderStatus.CANCELLED, Role.CUSTOMER)) {
      throw new BadRequestException(
        `Orders can only be cancelled while in PLACED status (current: ${order.status}). For assistance, please call the restaurant directly.`,
      );
    }

    order.status = OrderStatus.CANCELLED;
    order.cancellationReason = reason;
    order.statusHistory.push({ status: OrderStatus.CANCELLED, by: customerId, at: new Date(), note: reason });
    const saved = await order.save();

    // Emit to order room (so customer on tracking screen updates) & restaurant
    this.gateway.emitToOrder(saved._id.toString(), SocketEvents.ORDER_STATUS, {
      orderId: saved._id.toString(), status: OrderStatus.CANCELLED,
    });
    this.gateway.emitToRestaurant(SocketEvents.ORDER_STATUS, {
      orderId: saved._id.toString(), status: OrderStatus.CANCELLED,
    });

    if (saved.riderId) {
      this.gateway.emitToCustomer(saved.riderId.toString(), SocketEvents.ORDER_STATUS, {
        orderId: saved._id.toString(), status: OrderStatus.CANCELLED,
      });
    }

    return saved;
  }

  // ── Get order OTP (for customer tracking screen only) ──
  async getOtpForCustomer(orderId: string, customerId: string): Promise<string> {
    const order = await this.orderModel.findById(orderId).select('+deliveryOtp');
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId.toString() !== customerId) throw new ForbiddenException('Access denied');
    return order.deliveryOtp ?? '';
  }

  // ── Rider: available orders list ─────────────────────
  async getAvailableOrders() {
    return this.orderModel
      .find({ status: OrderStatus.READY, riderId: null })
      .sort({ createdAt: 1 })
      .select('-deliveryOtp -deliveryAddress.addressLine')
      .lean();
  }

  // ── Rider: active order ───────────────────────────────
  async getRiderActiveOrder(riderId: string) {
    return this.orderModel
      .findOne({
        riderId,
        status: { $in: [OrderStatus.RIDER_ASSIGNED, OrderStatus.PICKED_UP] },
      })
      .lean();
  }

  // ── Admin analytics ───────────────────────────────────
  async getAnalytics(days = 30) {
    const from = new Date(Date.now() - days * 86400000);
    const [revenueData, statusData] = await Promise.all([
      this.orderModel.aggregate([
        { $match: { createdAt: { $gte: from }, status: OrderStatus.DELIVERED } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalPaisa' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.orderModel.aggregate([
        { $match: { createdAt: { $gte: from } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);
    return { revenueData, statusData };
  }

  // ── Private: post-transition side-effects ─────────────
  private async handlePostTransition(order: OrderDocument, actorId: string): Promise<void> {
    const orderId = order._id.toString();
    const { status, orderNumber, customerId } = order;

    // 1. Notify customer via socket + FCM on every status change
    this.gateway.emitToCustomer(customerId.toString(), SocketEvents.ORDER_STATUS, {
      orderId, status,
    });
    this.gateway.emitToOrder(orderId, SocketEvents.ORDER_STATUS, {
      orderId, status,
    });
    this.gateway.emitToRestaurant(SocketEvents.ORDER_STATUS, { orderId, status });

    const customer = await this.usersService.findById(customerId.toString());
    if (customer?.fcmToken) {
      await this.notifications.notifyCustomerOrderStatus(
        customer.fcmToken, orderNumber, status, orderId,
      );
    }

    // 2. When READY: dispatch to riders via socket + FCM + start 60s timeout job
    if (status === OrderStatus.READY) {
      // Find all online riders and send delivery request
      const onlineRiders = await this.usersService.findOnlineRiders();
      const riderFcmTokens: Record<string, string> = {};

      // Socket push to all available riders
      this.gateway.emitToAvailableRiders('delivery:request', {
        orderId,
        orderNumber,
        totalPaisa: order.totalPaisa,
        itemCount: order.items.length,
        deliveryAddress: {
          lat: order.deliveryAddress?.lat,
          lng: order.deliveryAddress?.lng,
        }, // rough area only — exact address revealed after accept
      });

      // FCM backup to riders
      for (const rider of onlineRiders) {
        if (rider.fcmToken) {
          riderFcmTokens[rider._id.toString()] = rider.fcmToken;
        }
      }
      const tokens = Object.values(riderFcmTokens);
      if (tokens.length) {
        await this.notifications.notifyRiderDeliveryRequest(tokens[0], orderNumber, orderId);
        if (tokens.length > 1) {
          await this.notifications.sendToTokens(
            tokens.slice(1),
            '🏍️ New Delivery Request',
            `Order #${orderNumber} is ready for pickup`,
            { type: 'DELIVERY_REQUEST', orderId },
          );
        }
      }

      // Enqueue 60s timeout job — if nobody accepts, alert admin
      if (this.dispatchQueue) {
        await this.dispatchQueue.add(
          JOB_DISPATCH_OFFER,
          { orderId, orderNumber, riderFcmTokens },
          { delay: 60_000, attempts: 1, removeOnComplete: true, removeOnFail: true },
        );
      }
    }
  }
}
