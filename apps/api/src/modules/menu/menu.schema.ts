import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;
export type MenuItemDocument = MenuItem & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true }) name: string;
  @Prop() icon?: string;
  @Prop() image?: string;
  @Prop({ default: 0 }) sortOrder: number;
  @Prop({ default: true }) isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

@Schema({ timestamps: true })
export class MenuItem {
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ trim: true }) description?: string;
  @Prop({ required: true }) categoryId: string;
  @Prop({ required: true, type: Number }) basePrice: number; // integer paisa
  @Prop() image?: string;
  @Prop() emoji?: string;
  @Prop({ default: true }) isAvailable: boolean;
  @Prop({
    type: [{ label: String, price: Number }],
    default: [],
  })
  sizes: { label: string; price: number }[];

  @Prop({
    type: [{ label: String, price: Number }],
    default: [],
  })
  addOns: { label: string; price: number }[];
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
MenuItemSchema.index({ categoryId: 1, isAvailable: 1 });
MenuItemSchema.index({ name: 'text', description: 'text' });
