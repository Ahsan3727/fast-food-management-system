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
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const shared_types_1 = require("@fastfood/shared-types");
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    jwtService;
    config;
    redis;
    server;
    logger = new common_1.Logger(RealtimeGateway_1.name);
    // Map of orderId → Set of socket IDs sharing location (rate-limit enforcement)
    lastLocationEmit = new Map();
    constructor(jwtService, config, redis) {
        this.jwtService = jwtService;
        this.config = config;
        this.redis = redis;
    }
    // ── Connection: validate JWT on handshake ─────────────
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token;
            if (!token)
                throw new Error('No token');
            const payload = this.jwtService.verify(token, {
                secret: this.config.get('JWT_SECRET'),
            });
            client.userId = payload.sub;
            client.role = payload.role;
            // Server joins rooms based on verified JWT — never from client input
            const ac = client;
            if (ac.role === shared_types_1.Role.RIDER) {
                await client.join(`riders:available`);
                this.logger.log(`Rider ${ac.userId} connected and joined riders:available`);
            }
            else if (ac.role === shared_types_1.Role.CUSTOMER) {
                await client.join(`user:${ac.userId}`);
                this.logger.log(`Customer ${ac.userId} connected`);
            }
            else if (ac.role === shared_types_1.Role.ADMIN || ac.role === shared_types_1.Role.STAFF) {
                await client.join(`restaurant:main`);
                this.logger.log(`Staff ${ac.userId} joined restaurant:main`);
            }
        }
        catch {
            this.logger.warn('Rejected unauthenticated socket connection');
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    // ── Rider: join order room after accepting ────────────
    async handleJoinOrder(client, data) {
        if (!client.userId)
            return;
        // Only riders and customers join order rooms — authorized by server
        await client.join(`order:${data.orderId}`);
    }
    // ── Rider: emit location (rate-limited, 5s minimum) ───
    async handleRiderLocation(client, data) {
        if (client.role !== shared_types_1.Role.RIDER)
            return;
        // Rate-limit: max 1 update per 4 seconds per order
        const key = `${client.userId}:${data.orderId}`;
        const last = this.lastLocationEmit.get(key) ?? 0;
        if (Date.now() - last < 4000)
            return;
        this.lastLocationEmit.set(key, Date.now());
        // Persist to Redis (60s TTL) — plan rule: GPS pings NOT in MongoDB
        await this.redis.setRiderLocation(client.userId, data.lat, data.lng);
        // Forward ONLY to that order's room (not to all customers)
        this.server.to(`order:${data.orderId}`).emit(shared_types_1.SocketEvents.RIDER_LOCATION_UPDATE, {
            lat: data.lat,
            lng: data.lng,
            orderId: data.orderId,
        });
    }
    // ── Server-side emit helpers ──────────────────────────
    emitToRestaurant(event, data) {
        this.server.to('restaurant:main').emit(event, data);
    }
    emitToOrder(orderId, event, data) {
        this.server.to(`order:${orderId}`).emit(event, data);
    }
    emitToCustomer(customerId, event, data) {
        this.server.to(`user:${customerId}`).emit(event, data);
    }
    emitToAvailableRiders(event, data) {
        this.server.to('riders:available').emit(event, data);
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:order'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleJoinOrder", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(shared_types_1.SocketEvents.RIDER_LOCATION_EMIT),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "handleRiderLocation", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:5173'],
            credentials: true,
        },
        transports: ['websocket'], // No polling — websocket only
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map