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
    BullModule.registerQueue({ name: RIDER_DISPATCH_QUEUE }),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    RealtimeModule,
    NotificationsModule,
  ],
  providers: [RiderDispatchProcessor],
  exports: [BullModule],
})
export class JobsModule {}
