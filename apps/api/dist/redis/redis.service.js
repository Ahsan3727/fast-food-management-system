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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    config;
    logger = new common_1.Logger(RedisService_1.name);
    client;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        const url = this.config.get('REDIS_URL');
        if (!url) {
            this.logger.warn('REDIS_URL not set — Redis features disabled');
            return;
        }
        this.client = new ioredis_1.default(url, { lazyConnect: true, maxRetriesPerRequest: 3 });
        this.client.on('connect', () => this.logger.log('Redis connected'));
        this.client.on('error', (e) => this.logger.error(`Redis error: ${e.message}`));
        this.client.connect().catch(() => { });
    }
    async onModuleDestroy() {
        if (this.client)
            await this.client.quit();
    }
    get isReady() {
        return !!this.client && this.client.status === 'ready';
    }
    getClient() {
        return this.client ?? null;
    }
    // ── Rider location (live GPS, not MongoDB) ───────────────
    async setRiderLocation(riderId, lat, lng) {
        if (!this.isReady)
            return;
        await this.client.setex(`rider:loc:${riderId}`, 60, // expires 60 s → stale rider marker disappears
        JSON.stringify({ lat, lng, ts: Date.now() }));
    }
    async getRiderLocation(riderId) {
        if (!this.isReady)
            return null;
        const raw = await this.client.get(`rider:loc:${riderId}`);
        return raw ? JSON.parse(raw) : null;
    }
    async deleteRiderLocation(riderId) {
        if (!this.isReady)
            return;
        await this.client.del(`rider:loc:${riderId}`);
    }
    // ── Generic helpers ──────────────────────────────────────
    async get(key) {
        if (!this.isReady)
            return null;
        return this.client.get(key);
    }
    async setex(key, ttlSeconds, value) {
        if (!this.isReady)
            return;
        await this.client.setex(key, ttlSeconds, value);
    }
    async del(key) {
        if (!this.isReady)
            return;
        await this.client.del(key);
    }
    async incr(key) {
        if (!this.isReady)
            return 0;
        return this.client.incr(key);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map