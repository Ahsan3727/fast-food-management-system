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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let NotificationsService = NotificationsService_1 = class NotificationsService {
    config;
    logger = new common_1.Logger(NotificationsService_1.name);
    initialized = false;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        const serviceAccountJson = this.config.get('FCM_SERVICE_ACCOUNT_JSON');
        if (!serviceAccountJson) {
            this.logger.warn('FCM_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
            return;
        }
        try {
            const serviceAccount = JSON.parse(serviceAccountJson);
            if (!firebase_admin_1.default.apps.length) {
                firebase_admin_1.default.initializeApp({ credential: firebase_admin_1.default.credential.cert(serviceAccount) });
            }
            this.initialized = true;
            this.logger.log('Firebase Admin initialized — FCM ready');
        }
        catch (e) {
            this.logger.error(`Firebase init failed: ${e.message}`);
        }
    }
    // ── Send to a single device token ───────────────────────
    async sendToToken(fcmToken, title, body, data) {
        if (!this.initialized || !fcmToken)
            return;
        try {
            await firebase_admin_1.default.messaging().send({
                token: fcmToken,
                notification: { title, body },
                data: data ?? {},
                android: {
                    priority: 'high',
                    notification: { channelId: 'fastfood_orders', sound: 'default' },
                },
            });
        }
        catch (e) {
            this.logger.warn(`FCM send failed for token ${fcmToken.slice(0, 10)}…: ${e.message}`);
        }
    }
    // ── Send to multiple tokens (batch) ─────────────────────
    async sendToTokens(tokens, title, body, data) {
        if (!this.initialized || !tokens.length)
            return;
        const chunks = this.chunk(tokens, 500); // FCM max per batch
        for (const chunk of chunks) {
            try {
                await firebase_admin_1.default.messaging().sendEachForMulticast({
                    tokens: chunk,
                    notification: { title, body },
                    data: data ?? {},
                    android: { priority: 'high', notification: { channelId: 'fastfood_orders', sound: 'default' } },
                });
            }
            catch (e) {
                this.logger.warn(`FCM multicast failed: ${e.message}`);
            }
        }
    }
    // ── Convenience: notify rider of delivery request ────────
    async notifyRiderDeliveryRequest(fcmToken, orderNumber, orderId) {
        await this.sendToToken(fcmToken, '🏍️ New Delivery Request', `Order #${orderNumber} is ready for pickup`, { type: 'DELIVERY_REQUEST', orderId });
    }
    // ── Convenience: notify customer of order status ─────────
    async notifyCustomerOrderStatus(fcmToken, orderNumber, status, orderId) {
        const messages = {
            ACCEPTED: '✅ Your order has been accepted!',
            PREPARING: '👨‍🍳 Your order is being prepared',
            READY: '🔔 Your order is ready for pickup',
            RIDER_ASSIGNED: '🏍️ A rider is on their way',
            PICKED_UP: '📦 Your order is on the way!',
            DELIVERED: '🎉 Your order has been delivered!',
            CANCELLED: '❌ Your order was cancelled',
            REJECTED: '❌ Your order was rejected',
        };
        const body = messages[status] ?? `Order status: ${status}`;
        await this.sendToToken(fcmToken, `Order #${orderNumber}`, body, { type: 'ORDER_STATUS', orderId, status });
    }
    chunk(arr, size) {
        return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map