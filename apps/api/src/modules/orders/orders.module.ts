import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { Order, OrderSchema } from './order.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MenuModule } from '../menu/menu.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { UsersModule } from '../users/users.module';
import { RidersModule } from '../riders/riders.module';
import { RIDER_DISPATCH_QUEUE } from '../../jobs/rider-dispatch.processor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    MenuModule,
    NotificationsModule,
    RealtimeModule,
    UsersModule,
    RidersModule,
    // BullMQ queue — Optional: if Redis isn't available the @Optional() in service prevents crash
    BullModule.registerQueue({ name: RIDER_DISPATCH_QUEUE }),
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
