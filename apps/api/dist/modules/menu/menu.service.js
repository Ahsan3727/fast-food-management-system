"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const menu_schema_1 = require("./menu.schema");
const class_validator_1 = require("class-validator");
class CreateCategoryDto {
    name;
    icon;
    image;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "icon", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "image", void 0);
class CreateMenuItemDto {
    name;
    description;
    categoryId;
    basePrice; // paisa
    image;
    emoji;
    isAvailable;
    sizes;
    addOns;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMenuItemDto.prototype, "basePrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "image", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "emoji", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMenuItemDto.prototype, "isAvailable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateMenuItemDto.prototype, "sizes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateMenuItemDto.prototype, "addOns", void 0);
let MenuService = class MenuService {
    categoryModel;
    menuItemModel;
    constructor(categoryModel, menuItemModel) {
        this.categoryModel = categoryModel;
        this.menuItemModel = menuItemModel;
    }
    // ── Categories ─────────────────────────────
    async getCategories() {
        return this.categoryModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    }
    async createCategory(dto) {
        return new this.categoryModel(dto).save();
    }
    // ── Menu Items ─────────────────────────────
    async getMenu(categoryId, includeUnavailable = false) {
        const filter = {};
        if (!includeUnavailable) {
            filter['isAvailable'] = true;
        }
        if (categoryId)
            filter['categoryId'] = categoryId;
        return this.menuItemModel.find(filter).lean();
    }
    async getItemById(id) {
        const item = await this.menuItemModel.findById(id).lean();
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        return item;
    }
    async searchMenu(q) {
        return this.menuItemModel
            .find({ $text: { $search: q }, isAvailable: true })
            .limit(20)
            .lean();
    }
    async createMenuItem(dto) {
        return new this.menuItemModel(dto).save();
    }
    async toggleAvailability(id) {
        const item = await this.menuItemModel.findById(id);
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        item.isAvailable = !item.isAvailable;
        return item.save();
    }
    /** Validate cart items and return calculated total in paisa */
    async validateCartAndPrice(items) {
        if (!items || items.length === 0) {
            throw new common_1.BadRequestException('Order items cannot be empty');
        }
        const itemIds = [...new Set(items.map((i) => i.menuItemId))];
        const menuItems = await this.menuItemModel.find({ _id: { $in: itemIds } }).lean();
        const menuItemMap = new Map(menuItems.map((m) => [m._id.toString(), m]));
        let totalPaisa = 0;
        const snapshots = [];
        for (const item of items) {
            const menuItem = menuItemMap.get(item.menuItemId);
            if (!menuItem) {
                throw new common_1.BadRequestException(`Item with ID "${item.menuItemId}" not found`);
            }
            if (!menuItem.isAvailable) {
                throw new common_1.BadRequestException(`"${menuItem.name}" is currently unavailable`);
            }
            let unitPrice = menuItem.basePrice;
            // Validate and apply size
            if (item.sizeLabel) {
                const size = menuItem.sizes?.find((s) => s.label === item.sizeLabel);
                if (!size) {
                    throw new common_1.BadRequestException(`Invalid size "${item.sizeLabel}" for "${menuItem.name}"`);
                }
                unitPrice = size.price;
            }
            // Validate and apply add-ons
            for (const addOnLabel of item.addOns ?? []) {
                const addOn = menuItem.addOns?.find((a) => a.label === addOnLabel);
                if (!addOn) {
                    throw new common_1.BadRequestException(`Invalid add-on "${addOnLabel}" for "${menuItem.name}"`);
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
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(menu_schema_1.Category.name)),
    __param(1, (0, mongoose_1.InjectModel)(menu_schema_1.MenuItem.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], MenuService);
//# sourceMappingURL=menu.service.js.map