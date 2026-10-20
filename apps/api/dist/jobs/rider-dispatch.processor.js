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
var RiderDispatchProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiderDispatchProcessor = exports.JOB_DISPATCH_OFFER = exports.RIDER_DISPATCH_QUEUE = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_schema_1 = require("../modules/orders/order.schema");
const shared_types_1 = require("@fastfood/shared-types");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const notifications_service_1 = require("../modules/notifications/notifications.service");
exports.RIDER_DISPATCH_QUEUE = 'rider-dispatch';
exports.JOB_DISPATCH_OFFER = 'dispatch-offer';
let RiderDispatchProcessor = RiderDispatchProcessor_1 = class RiderDispatchProcessor extends bullmq_1.WorkerHost {
    orderModel;
    gateway;
    notifications;
    logger = new common_1.Logger(RiderDispatchProcessor_1.name);
    constructor(orderModel, gateway, notifications) {
        super();
        this.orderModel = orderModel;
        this.gateway = gateway;
        this.notifications = notifications;
    }
    async process(job) {
        if (job.name !== exports.JOB_DISPATCH_OFFER)
            return;
        const { orderId, orderNumber, riderFcmTokens } = job.data;
        // Check if order was already accepted before timeout fired
        const order = await this.orderModel.findById(orderId).lean();
        if (!order)
            return;
        if (order.status !== shared_types_1.OrderStatus.READY) {
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
        await this.notifications.sendToTokens(tokens, '🚨 Urgent — Delivery Needed', `Order #${orderNumber} still needs a rider — please accept!`, { type: 'DELIVERY_REQUEST_URGENT', orderId });
    }
};
exports.RiderDispatchProcessor = RiderDispatchProcessor;
exports.RiderDispatchProcessor = RiderDispatchProcessor = RiderDispatchProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(exports.RIDER_DISPATCH_QUEUE),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        realtime_gateway_1.RealtimeGateway,
        notifications_service_1.NotificationsService])
], RiderDispatchProcessor);
//# sourceMappingURL=rider-dispatch.processor.js.map