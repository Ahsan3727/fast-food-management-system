import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument, MenuItem, MenuItemDocument } from './menu.schema';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';

class CreateCategoryDto {
  @IsString() name: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() image?: string;
}

class CreateMenuItemDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsString() categoryId: string;
  @IsNumber() basePrice: number; // paisa
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() emoji?: string;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsArray() sizes?: { label: string; price: number }[];
  @IsOptional() @IsArray() addOns?: { label: string; price: number }[];
}

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
  ) {}

  // ── Categories ─────────────────────────────
  async getCategories() {
    return this.categoryModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  }

  async createCategory(dto: CreateCategoryDto) {
    return new this.categoryModel(dto).save();
  }

  // ── Menu Items ─────────────────────────────
  async getMenu(categoryId?: string, includeUnavailable = false) {
    const filter: Record<string, unknown> = {};
    if (!includeUnavailable) {
      filter['isAvailable'] = true;
    }
    if (categoryId) filter['categoryId'] = categoryId;
    return this.menuItemModel.find(filter).lean();
  }

  async getItemById(id: string) {
    const item = await this.menuItemModel.findById(id).lean();
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async searchMenu(q: string) {
    return this.menuItemModel
      .find({ $text: { $search: q }, isAvailable: true })
      .limit(20)
      .lean();
  }

  async createMenuItem(dto: CreateMenuItemDto) {
    return new this.menuItemModel(dto).save();
  }

  async toggleAvailability(id: string) {
    const item = await this.menuItemModel.findById(id);
    if (!item) throw new NotFoundException('Menu item not found');
    item.isAvailable = !item.isAvailable;
    return item.save();
  }

  /** Validate cart items and return calculated total in paisa */
  async validateCartAndPrice(
    items: { menuItemId: string; quantity: number; sizeLabel?: string; addOns?: string[] }[],
  ): Promise<{ itemSnapshots: object[]; totalPaisa: number }> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Order items cannot be empty');
    }

    const itemIds = [...new Set(items.map((i) => i.menuItemId))];
    const menuItems = await this.menuItemModel.find({ _id: { $in: itemIds } }).lean();
    const menuItemMap = new Map(menuItems.map((m) => [m._id.toString(), m]));

    let totalPaisa = 0;
    const snapshots = [];

    for (const item of items) {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem) {
        throw new BadRequestException(`Item with ID "${item.menuItemId}" not found`);
      }
      if (!menuItem.isAvailable) {
        throw new BadRequestException(`"${menuItem.name}" is currently unavailable`);
      }

      let unitPrice = menuItem.basePrice;

      // Validate and apply size
      if (item.sizeLabel) {
        const size = menuItem.sizes?.find((s) => s.label === item.sizeLabel);
        if (!size) {
          throw new BadRequestException(`Invalid size "${item.sizeLabel}" for "${menuItem.name}"`);
        }
        unitPrice = size.price;
      }

      // Validate and apply add-ons
      for (const addOnLabel of item.addOns ?? []) {
        const addOn = menuItem.addOns?.find((a) => a.label === addOnLabel);
        if (!addOn) {
          throw new BadRequestException(`Invalid add-on "${addOnLabel}" for "${menuItem.name}"`);
        }
        unitPrice += addOn.price;
      }

      const lineTotal = unitPrice * item.quantity;
      totalPaisa += lineTotal;

      snapshots.push({
        menuItemId: menuItem._id.toString(),
        name: menuItem.name,
        image: menuItem.image,
        sizeLabel: item.sizeLabel,
        addOns: item.addOns ?? [],
        unitPricePaisa: unitPrice,
        quantity: item.quantity,
        lineTotalPaisa: lineTotal,
      });
    }

    return { itemSnapshots: snapshots, totalPaisa };
  }
}
