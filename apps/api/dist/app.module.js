"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const bullmq_1 = require("@nestjs/bullmq");
const joi_1 = __importDefault(require("joi"));
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const menu_module_1 = require("./modules/menu/menu.module");
const orders_module_1 = require("./modules/orders/orders.module");
const riders_module_1 = require("./modules/riders/riders.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const realtime_module_1 = require("./realtime/realtime.module");
const health_module_1 = require("./modules/health/health.module");
const app_config_module_1 = require("./modules/app-config/app-config.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const redis_module_1 = require("./redis/redis.module");
const jobs_module_1 = require("./jobs/jobs.module");
const otp_module_1 = require("./modules/otp/otp.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // ── Config with validation ─────────────────
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
                validationSchema: joi_1.default.object({
                    PORT: joi_1.default.number().default(5000),
                    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').default('development'),
                    MONGO_URI: joi_1.default.string().required(),
                    JWT_SECRET: joi_1.default.string().min(16).required(),
                    JWT_REFRESH_SECRET: joi_1.default.string().min(16).default('refresh_secret_change_me_in_prod'),
                    JWT_EXPIRES_IN: joi_1.default.string().default('15m'),
                    JWT_REFRESH_EXPIRES_IN: joi_1.default.string().default('7d'),
                    CORS_ORIGINS: joi_1.default.string().default('http://localhost:5173,http://localhost:5174,http://localhost:5175'),
                    // Redis — optional; features degrade gracefully without it
                    REDIS_URL: joi_1.default.string().uri().optional(),
                    // Cloudinary
                    CLOUDINARY_CLOUD_NAME: joi_1.default.string().optional().default(''),
                    CLOUDINARY_API_KEY: joi_1.default.string().optional().default(''),
                    CLOUDINARY_API_SECRET: joi_1.default.string().optional().default(''),
                    // Firebase FCM — optional; push disabled without it
                    FCM_SERVICE_ACCOUNT_JSON: joi_1.default.string().optional(),
                }),
                validationOptions: { abortEarly: true },
            }),
            // ── MongoDB ────────────────────────────────
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (cfg) => ({
                    uri: cfg.get('MONGO_URI'),
                }),
                inject: [config_1.ConfigService],
            }),
            // ── BullMQ (Redis-backed job queues) ───────
            // Registered globally so all modules can use registerQueue
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (cfg) => {
                    const redisUrl = cfg.get('REDIS_URL');
                    if (!redisUrl) {
                        // No Redis — BullMQ won't work but won't crash the app either
                        // maxRetriesPerRequest:0 prevents connection retry spam in logs
                        return {
                            connection: {
                                host: 'localhost',
                                port: 6379,
                                lazyConnect: true,
                                enableOfflineQueue: false,
                                maxRetriesPerRequest: 0,
                                retryStrategy: () => null, // never retry
                            },
                        };
                    }
                    return { connection: { url: redisUrl } };
                },
                inject: [config_1.ConfigService],
            }),
            // ── Rate limiting ──────────────────────────
            throttler_1.ThrottlerModule.forRoot([
                { name: 'short', ttl: 1000, limit: 20 },
                { name: 'medium', ttl: 60000, limit: 200 },
            ]),
            // ── Cron jobs ──────────────────────────────
            schedule_1.ScheduleModule.forRoot(),
            // ── Infrastructure ─────────────────────────
            redis_module_1.RedisModule, // Global — available everywhere
            jobs_module_1.JobsModule, // BullMQ workers
            // ── Feature modules ────────────────────────
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            menu_module_1.MenuModule,
            orders_module_1.OrdersModule,
            riders_module_1.RidersModule,
            notifications_module_1.NotificationsModule,
            realtime_module_1.RealtimeModule,
            health_module_1.HealthModule,
            app_config_module_1.AppConfigModule,
            uploads_module_1.UploadsModule,
            otp_module_1.OtpModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map