import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '@fastfood/shared-types';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ unique: true, sparse: true, trim: true, lowercase: true })
  email?: string;

  @Prop({ unique: true, sparse: true, trim: true })
  phone?: string;

  // NOTE: password field removed — customer auth uses OTP.
  // Admin/Rider accounts can be seeded directly via DB scripts if needed.

  @Prop({ type: String, enum: Role, default: Role.CUSTOMER })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isSuspended: boolean;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop()
  fcmToken?: string;

  @Prop({ type: Object })
  savedAddress?: {
    lat: number;
    lng: number;
    addressLine: string;
    landmark?: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

