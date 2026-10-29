import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@fastfood/shared-types';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string; // e.g. FD-1042

  @Prop({ required: true })
  customerId: string;

  @Prop()
  riderId?: string;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PLACED })
  status: OrderStatus;

  @Prop({ type: Array, default: [] })
  items: {
    menuItemId: string;
    name: string;
    image?: string;
    sizeLabel?: string;
    addOns: string[];
    unitPricePaisa: number;
    quantity: number;
    lineTotalPaisa: number;
  }[];

  @Prop({ default: 0 })
  subtotalPaisa: number;

  @Prop({ default: 0 })
  deliveryFeePaisa: number;

  @Prop({ required: true })
  totalPaisa: number; // integer paisa — never decimals

  @Prop({ type: Object, required: true })
  deliveryAddress: {
    lat: number;
    lng: number;
    addressLine: string;
    landmark?: string;
  };

  @Prop({ type: Object })
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    amountCollectedPaisa?: number;
  };

  @Prop() notes?: string;
  @Prop() rejectionReason?: string;
  @Prop() cancellationReason?: string;

  // OTP shown to customer, never sent to rider
  @Prop({ select: false })
  deliveryOtp?: string;

  // Idempotency key — prevents duplicate orders
  @Prop({ unique: true, sparse: true })
  idempotencyKey?: string;

  @Prop({ type: Array, default: [] })
  statusHistory: {
    status: string;
    by: string;
    at: Date;
    note?: string;
  }[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes for common query patterns
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ riderId: 1, status: 1 });
