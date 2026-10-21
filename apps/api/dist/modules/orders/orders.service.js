"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const order_schema_1 = require("./order.schema");
const shared_types_1 = require("@fastfood/shared-types");
const order_state_machine_1 = require("./order.state-machine");
const menu_service_1 = require("../menu/menu.service");
const notifications_service_1 = require("../notifications/notifications.service");
const realtime_gateway_1 = require("../../realtime/realtime.gateway");
const users_service_1 = require("../users/users.service");
const riders_module_1 = require("../riders/riders.module");
const rider_dispatch_processor_1 = require("../../jobs/rider-dispatch.processor");
let orderCounter = 1000;
let OrdersService = class OrdersService {
    orderModel;
    menuService;
    notifications;
    gateway;
    usersService;
    ridersService;
    dispatchQueue;
    constructor(orderModel, menuService, notifications, gateway, usersService, ridersService, dispatchQueue) {
        this.orderModel = orderModel;
        this.menuService = menuService;
        this.notifications = notifications;
        this.gateway = gateway;
        this.usersService = usersService;
        this.ridersService = ridersService;
        this.dispatchQueue = dispatchQueue;
    }
    async onModuleInit() {
        try {
            const latest = await this.orderModel.findOne({}, { orderNumber: 1 }).sort({ createdAt: -1 }).lean();
            if (latest?.orderNumber) {
                const match = latest.orderNumber.match(/\d+$/);
                if (match) {
                    orderCounter = Math.max(orderCounter, parseInt(match[0], 10));
                }
            }
        }
        catch {
            // Keep default counter if collection is empty or initial connection
        }
    }
    // ── Create Order ───────────────────────────────────────
    async create(customerId, body) {
        // Idempotency — prevent duplicate orders
        if (body.idempotencyKey) {
            const dup = await this.orderModel.findOne({ idempotencyKey: body.idempotencyKey }).lean();
            if (dup)
                return dup;
        }
        // Server calculates price — never trusting the client
        const { itemSnapshots, totalPaisa } = await this.menuService.validateCartAndPrice(body.items);
        // Generate delivery OTP (6 digits)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Atomic order number
        const orderNumber = `FD-${++orderCounter}`;
        const order = await new this.orderModel({
            orderNumber,
            customerId,
            status: shared_types_1.OrderStatus.PLACED,
            items: itemSnapshots,
            totalPaisa,
            deliveryAddress: body.deliveryAddress,
            payment: { method: body.payment.method ?? shared_types_1.PaymentMethod.COD, status: shared_types_1.PaymentStatus.PENDING },
            notes: body.notes,
            idempotencyKey: body.idempotencyKey,
            deliveryOtp: otp,
            statusHistory: [{ status: shared_types_1.OrderStatus.PLACED, by: customerId, at: new Date() }],
        }).save();
        // Notify restaurant via socket
        this.gateway.emitToRestaurant(shared_types_1.SocketEvents.ORDER_NEW, {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            totalPaisa: order.totalPaisa,
            itemCount: order.items.length,
        });
        return order;
    }
    // ── Customer: list orders ──────────────────────────────
    async listForCustomer(customerId, page = 1, limit = 20) {
        const skip = (page - 1) * Math.min(limit, 50);
        return this.orderModel
            .find({ customerId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Math.min(limit, 50))
            .lean();
    }
    // ── Get order by ID (with ownership check) ─────────────
    async getById(orderId, userId, role) {
        const order = await this.orderModel.findById(orderId).lean();
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (role === shared_types_1.Role.CUSTOMER && order.customerId.toString() !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (role === shared_types_1.Role.RIDER && order.riderId?.toString() !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return order;
    }
    // ── Admin: all orders ──────────────────────────────────
    async listAll(status, page = 1, limit = 50) {
        const filter = {};
        if (status)
            filter['status'] = status;
        const skip = (page - 1) * Math.min(limit, 100);
        return this.orderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.min(limit, 100)).lean();
    }
    // ── State transition (all actors) ─────────────────────
    async transition(orderId, toStatus, actorId, role, note) {
        const order = await this.orderModel.findById(orderId);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (role === shared_types_1.Role.RIDER && order.riderId?.toString() !== actorId) {
            throw new common_1.ForbiddenException('Not assigned rider');
        }
        if (!(0, order_state_machine_1.canTransition)(order.status, toStatus, role)) {
            throw new common_1.BadRequestException(`Cannot move from ${order.status} → ${toStatus} as ${role}`);
        }
        order.status = toStatus;
        order.statusHistory.push({ status: toStatus, by: actorId, at: new Date(), note });
        const saved = await order.save();
        // ── Post-transition side-effects ──────────────────────
        await this.handlePostTransition(saved, actorId);
        return saved;
    }
    // ── Rider accept (ATOMIC — prevents race condition) ────
    async riderAccept(orderId, riderId) {
        const order = await this.orderModel.findOneAndUpdate({ _id: orderId, status: shared_types_1.OrderStatus.READY, riderId: null }, {
            $set: { status: shared_types_1.OrderStatus.RIDER_ASSIGNED, riderId },
            $push: {
                statusHistory: { status: shared_types_1.OrderStatus.RIDER_ASSIGNED, by: riderId, at: new Date() },
            },
        }, { new: true });
        if (!order)
            throw new common_1.ConflictException('Order already taken or not available');
        // Notify customer their rider is assigned
        const customer = await this.usersService.findById(order.customerId.toString());
        if (customer?.fcmToken) {
            await this.notifications.notifyCustomerOrderStatus(customer.fcmToken, order.orderNumber, shared_types_1.OrderStatus.RIDER_ASSIGNED, order._id.toString());
        }
        this.gateway.emitToCustomer(order.customerId.toString(), shared_types_1.SocketEvents.ORDER_STATUS, {
            orderId: order._id.toString(), status: shared_types_1.OrderStatus.RIDER_ASSIGNED,
        });
        // Let rider join the order room
        this.gateway.emitToRestaurant(shared_types_1.SocketEvents.ORDER_STATUS, {
            orderId: order._id.toString(), status: shared_types_1.OrderStatus.RIDER_ASSIGNED, riderId,
        });
        return order;
    }
    // ── Delivery: verify OTP ───────────────────────────────
    async verifyOtpAndDeliver(orderId, riderId, otp, cashCollectedPaisa) {
        const order = await this.orderModel.findById(orderId).select('+deliveryOtp');
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.riderId?.toString() !== riderId)
            throw new common_1.ForbiddenException('Not assigned rider');
        if (order.status !== shared_types_1.OrderStatus.PICKED_UP) {
            throw new common_1.BadRequestException('Order must be PICKED_UP before delivery');
        }
        if (order.deliveryOtp !== otp)
            throw new common_1.BadRequestException('Invalid OTP');
        order.status = shared_types_1.OrderStatus.DELIVERED;
        order.payment.amountCollectedPaisa = cashCollectedPaisa;
        order.payment.status = shared_types_1.PaymentStatus.COLLECTED;
        order.statusHistory.push({ status: shared_types_1.OrderStatus.DELIVERED, by: riderId, at: new Date() });
        const saved = await order.save();
        // If Cash On Delivery, record cash collected by rider in rider ledger
        if (saved.payment?.method === shared_types_1.PaymentMethod.COD || !saved.payment?.method) {
            await this.ridersService.addUnsettledCash(riderId, saved.totalPaisa);
        }
        // Notify customer
        const customer = await this.usersService.findById(saved.customerId.toString());
        if (customer?.fcmToken) {
            await this.notifications.notifyCustomerOrderStatus(customer.fcmToken, saved.orderNumber, shared_types_1.OrderStatus.DELIVERED, saved._id.toString());
        }
        this.gateway.emitToCustomer(saved.customerId.toString(), shared_types_1.SocketEvents.ORDER_STATUS, {
            orderId: saved._id.toString(), status: shared_types_1.OrderStatus.DELIVERED,
        });
        return saved;
    }
    // ── Customer: cancel ───────────────────────────────────
    async cancel(orderId, customerId, reason) {
        const order = await this.orderModel.findById(orderId);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.customerId.toString() !== customerId)
            throw new common_1.ForbiddenException('Access denied');
        const cancellableStatuses = [shared_types_1.OrderStatus.PLACED, shared_types_1.OrderStatus.ACCEPTED];
        if (!cancellableStatuses.includes(order.status)) {
            throw new common_1.BadRequestException('Cannot cancel order at this stage');
        }
        order.status = shared_types_1.OrderStatus.CANCELLED;
        order.cancellationReason = reason;
        order.statusHistory.push({ status: shared_types_1.OrderStatus.CANCELLED, by: customerId, at: new Date(), note: reason });
        const saved = await order.save();
        this.gateway.emitToRestaurant(shared_types_1.SocketEvents.ORDER_STATUS, {
            orderId: saved._id.toString(), status: shared_types_1.OrderStatus.CANCELLED,
        });
        return saved;
    }
    // ── Get order OTP (for customer tracking screen only) ──
    async getOtpForCustomer(orderId, customerId) {
        const order = await this.orderModel.findById(orderId).select('+deliveryOtp');
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.customerId.toString() !== customerId)
            throw new common_1.ForbiddenException('Access denied');
        return order.deliveryOtp ?? '';
    }
    // ── Rider: available orders list ─────────────────────
    async getAvailableOrders() {
        return this.orderModel
            .find({ status: shared_types_1.OrderStatus.READY, riderId: null })
            .sort({ createdAt: 1 })
            .select('-deliveryOtp -deliveryAddress.addressLine')
            .lean();
    }
    // ── Rider: active order ───────────────────────────────
    async getRiderActiveOrder(riderId) {
        return this.orderModel
            .findOne({
            riderId,
            status: { $in: [shared_types_1.OrderStatus.RIDER_ASSIGNED, shared_types_1.OrderStatus.PICKED_UP] },
        })
            .lean();
    }
    // ── Admin analytics ───────────────────────────────────
    async getAnalytics(days = 30) {
        const from = new Date(Date.now() - days * 86400000);
        const [revenueData, statusData] = await Promise.all([
            this.orderModel.aggregate([
                { $match: { createdAt: { $gte: from }, status: shared_types_1.OrderStatus.DELIVERED } },
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
    async handlePostTransition(order, actorId) {
        const orderId = order._id.toString();
        const { status, orderNumber, customerId } = order;
        // 1. Notify customer via socket + FCM on every status change
        this.gateway.emitToCustomer(customerId.toString(), shared_types_1.SocketEvents.ORDER_STATUS, {
            orderId, status,
        });
        this.gateway.emitToRestaurant(shared_types_1.SocketEvents.ORDER_STATUS, { orderId, status });
        const customer = await this.usersService.findById(customerId.toString());
        if (customer?.fcmToken) {
            await this.notifications.notifyCustomerOrderStatus(customer.fcmToken, orderNumber, status, orderId);
        }
        // 2. When READY: dispatch to riders via socket + FCM + start 60s timeout job
        if (status === shared_types_1.OrderStatus.READY) {
            // Find all online riders and send delivery request
            const onlineRiders = await this.usersService.findOnlineRiders();
            const riderFcmTokens = {};
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
                    await this.notifications.sendToTokens(tokens.slice(1), '🏍️ New Delivery Request', `Order #${orderNumber} is ready for pickup`, { type: 'DELIVERY_REQUEST', orderId });
                }
            }
            // Enqueue 60s timeout job — if nobody accepts, alert admin
            if (this.dispatchQueue) {
                await this.dispatchQueue.add(rider_dispatch_processor_1.JOB_DISPATCH_OFFER, { orderId, orderNumber, riderFcmTokens }, { delay: 60_000, attempts: 1, removeOnComplete: true, removeOnFail: true });
            }
        }
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(6, (0, common_1.Optional)()),
    __param(6, (0, bullmq_1.InjectQueue)(rider_dispatch_processor_1.RIDER_DISPATCH_QUEUE)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        menu_service_1.MenuService,
        notifications_service_1.NotificationsService,
        realtime_gateway_1.RealtimeGateway,
        users_service_1.UsersService,
        riders_module_1.RidersService, Object])
], OrdersService);
//# sourceMappingURL=orders.service.js.map