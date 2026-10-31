import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RiderDispatchProcessor, RIDER_DISPATCH_QUEUE } from './rider-dispatch.processor';
import { Order, OrderSchema } from '../modules/orders/order.schema';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => {
        const redisUrl = cfg.get<string>('REDIS_URL');
        if (!redisUrl) {
          return {
            connection: {
              host: 'localhost', port: 6379,
              lazyConnect: true, enableOfflineQueue: false,
              maxRetriesPerRequest: 0,
              retryStrategy: () => null,
            },
          };
        }
        return { connection: { url: redisUrl } };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: RIDER_DISPATCH_QUEUE,
      defaultJobOptions: {
        removeOnComplete: 50,  // keep last 50 completed jobs only
        removeOnFail: 20,      // keep last 20 failed jobs only
      },
    }),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    RealtimeModule,
    NotificationsModule,
  ],
  providers: [
    RiderDispatchProcessor,
    {
      // Slow down BullMQ polling to stay within Upstash free tier (500k req/day)
      // stalledInterval: how often to check for stalled jobs (ms) — default 30s
      // drainDelay: how long to wait before polling again when queue is empty (ms)
      provide: 'BULLMQ_WORKER_OPTIONS',
      useValue: {
        stalledInterval: 30_000,   // check stalled jobs every 30s (default: 5s)
        drainDelay: 5_000,         // wait 5s between polls when queue is empty
        skipVersionCheck: true,
      },
    },
  ],
  exports: [BullModule],
})
export class JobsModule {}
