import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderCounterDocument = OrderCounter & Document;

@Schema({ collection: 'order_counters', timestamps: true })
export class OrderCounter {
  @Prop({ required: true, unique: true })
  _id: string;

  @Prop({ required: true, default: 1000 })
  seq: number;
}

export const OrderCounterSchema = SchemaFactory.createForClass(OrderCounter);
