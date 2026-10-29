import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PhoneOtpDocument = PhoneOtp & Document;

@Schema({ timestamps: true })
export class PhoneOtp {
  @Prop({ required: true, index: true })
  phone: string;

  @Prop({ required: true })
  codeHash: string;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: Date.now })
  lastSentAt: Date;

  @Prop({ default: 1 })
  hourlyCount: number;

  @Prop({ required: true, index: { expires: '0s' } })
  expiresAt: Date;
}

export const PhoneOtpSchema = SchemaFactory.createForClass(PhoneOtp);
PhoneOtpSchema.index({ phone: 1, expiresAt: 1 });
