import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import Joi from 'joi';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RidersModule } from './modules/riders/riders.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HealthModule } from './modules/health/health.module';
import { AppConfigModule } from './modules/app-config/app-config.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { RedisModule } from './redis/redis.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    // ── Config with validation ─────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        PORT: Joi.number().default(5000),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        MONGO_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().min(16).required(),
        JWT_REFRESH_SECRET: Joi.string().min(16).default('refresh_secret_change_me_in_prod'),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        CORS_ORIGINS: Joi.string().default('http://localhost:5173,http://localhost:5174,http://localhost:5175'),
        // Redis — optional; features degrade gracefully without it
        REDIS_URL: Joi.string().uri().optional(),
        // Cloudinary
        CLOUDINARY_CLOUD_NAME: Joi.string().optional().default(''),
        CLOUDINARY_API_KEY: Joi.string().optional().default(''),
        CLOUDINARY_API_SECRET: Joi.string().optional().default(''),
        // Firebase FCM — optional; push disabled without it
        FCM_SERVICE_ACCOUNT_JSON: Joi.string().optional(),
      }),
      validationOptions: { abortEarly: true },
    }),

    // ── MongoDB ────────────────────────────────
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    // ── BullMQ (Redis-backed job queues) ───────
    // Registered globally so all modules can use registerQueue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => {
        const redisUrl = cfg.get<string>('REDIS_URL');
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
      inject: [ConfigService],
    }),

    // ── Rate limiting ──────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 60000, limit: 200 },
    ]),

    // ── Cron jobs ──────────────────────────────
    ScheduleModule.forRoot(),

    // ── Infrastructure ─────────────────────────
    RedisModule,   // Global — available everywhere
    JobsModule,    // BullMQ workers

    // ── Feature modules ────────────────────────
    AuthModule,
    UsersModule,
    MenuModule,
    OrdersModule,
    RidersModule,
    NotificationsModule,
    RealtimeModule,
    HealthModule,
    AppConfigModule,
    UploadsModule,
  ],
})
export class AppModule {}
